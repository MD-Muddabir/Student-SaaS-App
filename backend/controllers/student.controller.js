/**
 * Student Controller
 * Handles CRUD operations for students
 * Implements institute-level data isolation
 */

const { Student, User, Class, Institute } = require("../models");
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
        } = req.body;

        const institute_id = req.user.institute_id;

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

        // Create student record
        const student = await Student.create({
            institute_id,
            user_id: user.id,
            roll_number,
            class_id,
            admission_date: admission_date || new Date(),
            date_of_birth,
            gender,
            address,
        });

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

        if (class_id) {
            whereClause.class_id = class_id;
        }

        // Search filter
        const userWhereClause = search
            ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                ],
            }
            : {};

        const { count, rows } = await Student.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "phone", "status"],
                    where: userWhereClause,
                    required: search ? true : false, // Use INNER JOIN only when searching
                },
                {
                    model: Class,
                    attributes: ["id", "name", "section"],
                    required: false,
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Students retrieved successfully",
            data: rows,
            count: count
        });
    } catch (error) {
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
                },
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

        res.status(200).json({
            success: true,
            message: "Student retrieved successfully",
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
            class_id: class_id || student.class_id,
            admission_date: admission_date || student.admission_date,
            date_of_birth: date_of_birth || student.date_of_birth,
            gender: gender || student.gender,
            address: address || student.address,
        });

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
