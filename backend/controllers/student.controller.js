/**
 * Student Controller
 * Handles CRUD operations for students
 * Implements institute-level data isolation
 */

const { Student, User, Class, Institute, Plan, Subject, StudentSubject, StudentClass, Faculty } = require("../models");
const { Op } = require("sequelize");
const { hashPassword } = require("../utils/hashPassword");

/**
 * Create a new student
 * @route POST /api/students
 * @access Admin, Faculty
 */

exports.createStudent = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            roll_number,
            class_id,
            admission_date,
            date_of_birth,
            gender,
            address,
            subject_ids, // New array of selected subject ids
            class_ids // New array of selected class ids
        } = req.body;

        const institute_id = req.user.institute_id;


        // Check Plan Limits
        const institute = await Institute.findByPk(institute_id, {
            include: [{ model: Plan }]
        });

        if (institute && institute.Plan) {
            const studentCount = await Student.count({ where: { institute_id } });
            if (institute.Plan.student_limit !== null && studentCount >= institute.Plan.student_limit) {
                return res.status(403).json({
                    success: false,
                    message: `Plan limit reached. Your plan allows a maximum of ${institute.Plan.student_limit} students. Upgrade your plan to add more.`
                });
            }
        }

        // Check if student email already exists in this institute
        const existingUser = await User.findOne({
            where: { email, institute_id },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Student with this email already exists in your institute",
            });
        }

        // Validate mandatory date fields BEFORE creating any DB records
        if (!date_of_birth || isNaN(new Date(date_of_birth))) {
            return res.status(400).json({
                success: false,
                message: "Date of Birth is required and must be a valid date (YYYY-MM-DD).",
            });
        }
        if (!admission_date || isNaN(new Date(admission_date))) {
            return res.status(400).json({
                success: false,
                message: "Admission Date is required and must be a valid date (YYYY-MM-DD).",
            });
        }

        // Hash password
        const password_hash = await hashPassword(password || "student123");

        // Create user account for student
        const user = await User.create({
            institute_id,
            role: "student",
            name,
            email,
            phone,
            password_hash,
            status: "active",
        });


        // Create student record — if this fails, rollback the user to avoid orphan
        let student;
        try {
            student = await Student.create({
                institute_id,
                user_id: user.id || user.user_id,
                roll_number,
                admission_date: admission_date,
                date_of_birth: date_of_birth,
                gender: gender ? gender.toLowerCase() : null,
                address,
                is_full_course: subject_ids && Array.isArray(subject_ids) ? subject_ids.includes("full_course") : false,
            });
        } catch (studentError) {
            // Cleanup orphaned user so admin can retry with same email
            await user.destroy();
            throw studentError;
        }

        // Add classes if provided
        if (class_ids && Array.isArray(class_ids) && class_ids.length > 0) {
            const studentClasses = class_ids.map(c_id => ({
                student_id: student.id,
                class_id: parseInt(c_id),
                institute_id: institute_id
            }));
            await StudentClass.bulkCreate(studentClasses);
        }

        // Add subjects if provided
        if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
            let actualSubjectIds = subject_ids.filter(id => id !== "full_course");

            if (subject_ids.includes("full_course") && class_ids && class_ids.length > 0) {
                const subjectsForClasses = await Subject.findAll({
                    where: { institute_id, class_id: { [Op.in]: class_ids } }
                });
                const allSubIds = subjectsForClasses.map(s => s.id.toString());
                actualSubjectIds = [...new Set([...actualSubjectIds, ...allSubIds])];
            }

            if (actualSubjectIds.length > 0) {
                const studentSubjects = actualSubjectIds.map(sub_id => ({
                    student_id: student.id,
                    subject_id: parseInt(sub_id),
                    institute_id: institute_id
                }));
                await StudentSubject.bulkCreate(studentSubjects);
            }
        }

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: {
                student,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
            },
        });
    } catch (error) {
        console.error("========== BACKEND ERROR ==========");
        console.error(error);
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("===================================");
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get all students for an institute
 * @route GET /api/students
 * @access Admin, Faculty
 */
exports.getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", class_id } = req.query;
        const institute_id = req.user.institute_id;

        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause = { institute_id };

        // Search filter
        const userWhereClause = search
            ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                ],
            }
            : {};

        // If class_id filter is specific, we still need to filter students that belong to this class
        const classIncludeOptions = {
            model: Class,
            attributes: ["id", "name", "section"],
            through: { attributes: [] },
            required: class_id ? true : false,
        };

        if (class_id) {
            classIncludeOptions.where = { id: class_id };
        }

        let subjectIncludeOptions = {
            model: Subject,
            attributes: ["id", "name"],
            through: { attributes: [] }
        };

        if (req.user.role === 'faculty') {
            const facultyRecord = await Faculty.findOne({ where: { user_id: req.user.id } });
            if (facultyRecord) {
                subjectIncludeOptions.where = { faculty_id: facultyRecord.id };
                subjectIncludeOptions.required = true;
            } else {
                return res.status(200).json({ success: true, message: "Students retrieved successfully", data: [], count: 0 });
            }
        }

        const { count, rows } = await Student.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["id", "DESC"]],
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "status"],
                    where: userWhereClause,
                    required: search ? true : false,
                },
                {
                    ...classIncludeOptions
                },
                subjectIncludeOptions
            ],
            distinct: true, // Prevents duplicate counts/rows if student takes multiple subjects
        });

        res.status(200).json({
            success: true,
            message: "Students retrieved successfully",
            data: rows,
            count: count
        });
    } catch (error) {
        console.error("Get All Students Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get student by ID
 * @route GET /api/students/:id
 * @access Admin, Faculty, Student (own record)
 */
exports.getMe = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;
        const user_id = req.user.id;

        const student = await Student.findOne({
            where: { user_id, institute_id },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "status"],
                },
                {
                    model: Class,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                },
                {
                    model: Subject,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                }
            ],
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student record not found",
            });
        }

        let responseData = student.toJSON ? student.toJSON() : student;
        if (responseData.is_full_course && responseData.Classes && responseData.Classes.length > 0) {
            const classIds = responseData.Classes.map(c => c.id);
            const allSubjects = await Subject.findAll({
                where: { institute_id, class_id: { [Op.in]: classIds } },
                attributes: ["id", "name"]
            });

            const existingSubIds = new Set((responseData.Subjects || []).map(s => s.id));
            const newSubjects = allSubjects.filter(s => !existingSubIds.has(s.id)).map(s => s.toJSON ? s.toJSON() : s);

            if (newSubjects.length > 0) {
                responseData.Subjects = [...(responseData.Subjects || []), ...newSubjects];
            }
        }

        res.status(200).json({
            success: true,
            message: "Student retrieved successfully",
            data: responseData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const institute_id = req.user.institute_id;

        const student = await Student.findOne({
            where: { id, institute_id },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "status"],
                },
                {
                    model: Class,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                },
                {
                    model: Subject,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                }
            ],
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        // If student role, ensure they can only access their own record
        if (req.user.role === "student" && student.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access forbidden",
            });
        }

        let responseData = student.toJSON ? student.toJSON() : student;
        if (responseData.is_full_course && responseData.Classes && responseData.Classes.length > 0) {
            const classIds = responseData.Classes.map(c => c.id);
            const allSubjects = await Subject.findAll({
                where: { institute_id, class_id: { [Op.in]: classIds } },
                attributes: ["id", "name"]
            });

            const existingSubIds = new Set((responseData.Subjects || []).map(s => s.id));
            const newSubjects = allSubjects.filter(s => !existingSubIds.has(s.id)).map(s => s.toJSON ? s.toJSON() : s);

            if (newSubjects.length > 0) {
                responseData.Subjects = [...(responseData.Subjects || []), ...newSubjects];
            }
        }

        res.status(200).json({
            success: true,
            message: "Student retrieved successfully",
            data: responseData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Update student
 * @route PUT /api/students/:id
 * @access Admin, Faculty
 */
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const institute_id = req.user.institute_id;
        const {
            name,
            email,
            phone,
            roll_number,
            class_id,
            admission_date,
            date_of_birth,
            gender,
            address,
            subject_ids,
            class_ids
        } = req.body;

        const student = await Student.findOne({
            where: { id, institute_id },
            include: [{ model: User }],
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        // Update user details
        if (name || email || phone) {
            await student.User.update({
                name: name || student.User.name,
                email: email || student.User.email,
                phone: phone || student.User.phone,
            });
        }

        // Update student details
        await student.update({
            roll_number: roll_number || student.roll_number,
            admission_date: admission_date || student.admission_date,
            date_of_birth: date_of_birth || student.date_of_birth,
            gender: gender || student.gender,
            address: address || student.address,
            is_full_course: subject_ids && Array.isArray(subject_ids) ? subject_ids.includes("full_course") : student.is_full_course,
        });

        // Update classes if provided
        if (class_ids && Array.isArray(class_ids)) {
            await StudentClass.destroy({ where: { student_id: id } });

            if (class_ids.length > 0) {
                const studentClasses = class_ids.map(c_id => ({
                    student_id: student.id,
                    class_id: parseInt(c_id),
                    institute_id: institute_id
                }));
                await StudentClass.bulkCreate(studentClasses);
            }
        }

        // Update subjects if provided
        if (subject_ids && Array.isArray(subject_ids)) {
            // Remove existing subjects for this student
            await StudentSubject.destroy({ where: { student_id: id } });

            // Add new ones
            let actualSubjectIds = subject_ids.filter(sub_id => sub_id !== "full_course");

            if (subject_ids.includes("full_course")) {
                let currentClassIds = class_ids;
                if (!currentClassIds || currentClassIds.length === 0) {
                    const studentClasses = await StudentClass.findAll({ where: { student_id: id } });
                    currentClassIds = studentClasses.map(sc => sc.class_id);
                }

                if (currentClassIds && currentClassIds.length > 0) {
                    const subjectsForClasses = await Subject.findAll({
                        where: { institute_id, class_id: { [Op.in]: currentClassIds } }
                    });
                    const allSubIds = subjectsForClasses.map(s => s.id.toString());
                    actualSubjectIds = [...new Set([...actualSubjectIds, ...allSubIds])];
                }
            }

            if (actualSubjectIds.length > 0) {
                const studentSubjects = actualSubjectIds.map(sub_id => ({
                    student_id: student.id,
                    subject_id: parseInt(sub_id),
                    institute_id: institute_id
                }));
                await StudentSubject.bulkCreate(studentSubjects);
            }
        }

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: student,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Delete student
 * @route DELETE /api/students/:id
 * @access Admin only
 */
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const institute_id = req.user.institute_id;

        const student = await Student.findOne({
            where: { id, institute_id },
            include: [{ model: User }],
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        // Delete user account
        await student.User.destroy();

        // Delete student record
        await student.destroy();

        res.status(200).json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get student statistics
 * @route GET /api/students/stats
 * @access Admin, Faculty
 */
exports.getStudentStats = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;

        const totalStudents = await Student.count({
            where: { institute_id },
        });

        const activeStudents = await Student.count({
            where: { institute_id },
            include: [
                {
                    model: User,
                    where: { status: "active" },
                },
            ],
        });

        const blockedStudents = await Student.count({
            where: { institute_id },
            include: [
                {
                    model: User,
                    where: { status: "blocked" },
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Student statistics retrieved successfully",
            data: {
                total: totalStudents,
                active: activeStudents,
                blocked: blockedStudents,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
