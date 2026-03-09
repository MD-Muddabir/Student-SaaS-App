const { User, StudentParent, Student, Class, Subject, Institute, Attendance, Mark, Exam, StudentFee, Note, NoteDownload } = require("../models");
const { hashPassword } = require("../utils/hashPassword");
const { Op } = require("sequelize");

// Helper function to check if student is linked to parent
const isStudentLinked = async (parent_id, student_id) => {
    const link = await StudentParent.findOne({
        where: { parent_id, student_id }
    });
    return !!link;
};

/**
 * Create a new parent
 * @route POST /api/parents
 * @access Admin
 */
exports.createParent = async (req, res) => {
    try {
        const { name, email, phone, password, student_ids, relationships } = req.body;
        const institute_id = req.user.institute_id;

        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "Name, email and phone are required" });
        }

        const existingUser = await User.findOne({ where: { email, institute_id } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with this email already exists" });
        }

        const password_hash = await hashPassword(password || "parent123");

        const user = await User.create({
            institute_id,
            role: "parent",
            name,
            email,
            phone,
            password_hash,
            status: "active"
        });

        if (student_ids && student_ids.length > 0) {
            const studentParents = student_ids.map((student_id, index) => ({
                student_id: student_id,
                parent_id: user.id,
                relationship: relationships && relationships[index] ? relationships[index] : "guardian"
            }));
            await StudentParent.bulkCreate(studentParents);
        }

        res.status(201).json({
            success: true,
            message: "Parent created successfully",
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all parents
 * @route GET /api/parents
 * @access Admin
 */
exports.getAllParents = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;
        const { search } = req.query;

        const whereClause = {
            institute_id,
            role: "parent",
        };

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        const parents = await User.findAll({
            where: whereClause,
            attributes: ["id", "name", "email", "phone", "status"],
            include: [{
                model: Student,
                as: "LinkedStudents",
                attributes: ["id", "roll_number", "institute_id"],
                include: [{ model: User, attributes: ["name"] }],
                through: { attributes: ["relationship"] }
            }],
            order: [["id", "DESC"]]
        });

        res.status(200).json({
            success: true,
            message: "Parents retrieved successfully",
            data: parents
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Parent Dashboard
 * @route GET /api/parents/dashboard
 * @access Parent
 */
exports.getDashboard = async (req, res) => {
    try {
        const parent_id = req.user.id;

        const students = await Student.findAll({
            include: [
                {
                    model: User,
                    as: "Parents",
                    where: { id: parent_id },
                    attributes: [],
                    through: { attributes: ["relationship"] }
                },
                { model: User, attributes: ["name", "email", "phone"] },
                { model: Class, attributes: ["id", "name"], through: { attributes: [] } },
                { model: Subject, attributes: ["id", "name"], through: { attributes: [] } }
            ]
        });

        let responseStudents = [];
        for (let student of students) {
            let responseData = student.toJSON ? student.toJSON() : student;
            if (responseData.is_full_course && responseData.Classes && responseData.Classes.length > 0) {
                const classIds = responseData.Classes.map(c => c.id);
                const allSubjects = await Subject.findAll({
                    where: { institute_id: req.user.institute_id, class_id: { [Op.in]: classIds } },
                    attributes: ["id", "name"]
                });

                const existingSubIds = new Set((responseData.Subjects || []).map(s => s.id));
                const newSubjects = allSubjects.filter(s => !existingSubIds.has(s.id)).map(s => s.toJSON ? s.toJSON() : s);

                if (newSubjects.length > 0) {
                    responseData.Subjects = [...(responseData.Subjects || []), ...newSubjects];
                }
            }
            responseStudents.push(responseData);
        }

        res.status(200).json({
            success: true,
            message: "Dashboard data retrieved",
            data: { students: responseStudents }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Student Profile for Parent
 * @route GET /api/parents/student/:id
 * @access Parent
 */
exports.getStudentProfile = async (req, res) => {
    try {
        const parent_id = req.user.id;
        const student_id = req.params.id;

        if (!(await isStudentLinked(parent_id, student_id))) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this student" });
        }

        const student = await Student.findByPk(student_id, {
            include: [
                { model: User, attributes: ["name", "email", "phone"] },
                { model: Class, attributes: ["id", "name"], through: { attributes: [] } },
                { model: Subject, attributes: ["id", "name"], through: { attributes: [] } }
            ]
        });

        let responseData = student.toJSON ? student.toJSON() : student;
        if (responseData.is_full_course && responseData.Classes && responseData.Classes.length > 0) {
            const classIds = responseData.Classes.map(c => c.id);
            const allSubjects = await Subject.findAll({
                where: { institute_id: req.user.institute_id, class_id: { [Op.in]: classIds } },
                attributes: ["id", "name"]
            });

            const existingSubIds = new Set((responseData.Subjects || []).map(s => s.id));
            const newSubjects = allSubjects.filter(s => !existingSubIds.has(s.id)).map(s => s.toJSON ? s.toJSON() : s);

            if (newSubjects.length > 0) {
                responseData.Subjects = [...(responseData.Subjects || []), ...newSubjects];
            }
        }

        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Attendance for linked student
 * @route GET /api/parents/attendance/:studentId
 * @access Parent
 */
exports.getStudentAttendance = async (req, res) => {
    try {
        const parent_id = req.user.id;
        const student_id = req.params.studentId;

        if (!(await isStudentLinked(parent_id, student_id))) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this student" });
        }

        const { Subject, Class } = require("../models");
        const records = await Attendance.findAll({
            where: { student_id, institute_id: req.user.institute_id },
            include: [
                { model: Subject, attributes: ["id", "name"] },
                { model: Class, attributes: ["id", "name", "section"] }
            ],
            order: [['date', 'ASC']]
        });

        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const holidays = records.filter(r => r.status === 'holiday').length;
        const total = records.filter(r => r.status !== 'holiday').length; // working days
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                records,
                summary: {
                    total_days: records.length,
                    working_days: total,
                    present_days: present,
                    absent_days: absent,
                    late_days: late,
                    holiday_days: holidays,
                    attendance_percentage: parseFloat(percentage) // Phase 7: align with frontend expects
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Marks for linked student
 * @route GET /api/parents/results/:studentId
 * @access Parent
 */
exports.getStudentResults = async (req, res) => {
    try {
        const parent_id = req.user.id;
        const student_id = req.params.studentId;

        if (!(await isStudentLinked(parent_id, student_id))) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const marks = await Mark.findAll({
            where: { student_id, institute_id: req.user.institute_id },
            include: [
                { model: Exam, attributes: ["name", "exam_date"] },
                { model: Subject, attributes: ["name"] }
            ],
            order: [[Exam, 'exam_date', 'DESC']]
        });

        res.status(200).json({ success: true, data: marks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Fees for linked student
 * @route GET /api/parents/fees/:studentId
 * @access Parent
 */
// Fees for linked student
exports.getStudentFees = async (req, res) => {
    try {
        const parent_id = req.user.id;
        const student_id = req.params.studentId;

        if (!(await isStudentLinked(parent_id, student_id))) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const { FeesStructure, Subject } = require("../models");
        const fees = await StudentFee.findAll({
            where: { student_id, institute_id: req.user.institute_id },
            include: [
                {
                    model: FeesStructure,
                    attributes: ["fee_type", "amount", "due_date"],
                    include: [{ model: Subject, attributes: ["name"] }]
                }
            ]
        });

        res.status(200).json({ success: true, data: fees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Notes
 * @route GET /api/parents/notes/:classId
 * @access Parent
 */
exports.getNotes = async (req, res) => {
    try {
        const { classId } = req.params;
        // Parents can view only notes for classes their linked students belong to
        const institute_id = req.user.institute_id;
        const notes = await Note.findAll({
            where: { class_id: classId, institute_id },
            include: [{ model: Subject, attributes: ["name"] }]
        });
        res.status(200).json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = exports;
