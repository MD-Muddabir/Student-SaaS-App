/**
 * Class Controller
 * Handles CRUD operations for classes
 * Implements institute-level data isolation
 */

const { Class, Student, Subject } = require("../models");
const { Op } = require("sequelize");

/**
 * Create a new class
 * @route POST /api/classes
 * @access Admin only
 */
exports.createClass = async (req, res) => {
    try {
        const { name, section } = req.body;
        const institute_id = req.user.institute_id;

        const classData = await Class.create({
            institute_id,
            name,
            section,
        });

        res.status(201).json({
            success: true,
            message: "Class created successfully",
            data: classData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get all classes
 * @route GET /api/classes
 * @access Admin, Faculty
 */
exports.getAllClasses = async (req, res) => {
    try {
        const { page = 1, limit = 100, search = "" } = req.query;
        const institute_id = req.user.institute_id;

        const offset = (page - 1) * limit;

        const whereClause = { institute_id };

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { section: { [Op.like]: `%${search}%` } },
            ];
        }

        const includeOptions = [
            {
                model: Student,
                attributes: ["id"],
            },
            {
                model: Subject,
                attributes: ["id", "name"],
            },
        ];

        // If faculty, strictly only show classes where they teach a subject
        if (req.user.role === 'faculty') {
            const { Faculty } = require('../models');
            const facultyRecord = await Faculty.findOne({ where: { user_id: req.user.id } });
            if (facultyRecord) {
                includeOptions[1].where = { faculty_id: facultyRecord.id };
                includeOptions[1].required = true;
            } else {
                return res.status(200).json({ success: true, message: "Classes retrieved successfully", data: [], count: 0 });
            }
        }

        const { count, rows } = await Class.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["name", "ASC"]],
            include: includeOptions,
            distinct: true, // Important for correct count with includes
        });

        res.status(200).json({
            success: true,
            message: "Classes retrieved successfully",
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
 * Get class by ID
 * @route GET /api/classes/:id
 * @access Admin, Faculty
 */
exports.getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const institute_id = req.user.institute_id;

        const classData = await Class.findOne({
            where: { id, institute_id },
            include: [
                {
                    model: Student,
                    attributes: ["id", "roll_number"],
                },
                {
                    model: Subject,
                    attributes: ["id", "name"],
                },
            ],
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Class retrieved successfully",
            data: classData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Update class
 * @route PUT /api/classes/:id
 * @access Admin only
 */
exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const institute_id = req.user.institute_id;
        const { name, section, description } = req.body;

        const classData = await Class.findOne({
            where: { id, institute_id },
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        await classData.update({
            name: name || classData.name,
            section: section || classData.section,
            description: description || classData.description,
        });

        res.status(200).json({
            success: true,
            message: "Class updated successfully",
            data: classData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Delete class
 * @route DELETE /api/classes/:id
 * @access Admin only
 */
exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const institute_id = req.user.institute_id;

        const classData = await Class.findOne({
            where: { id, institute_id },
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        await classData.destroy();

        res.status(200).json({
            success: true,
            message: "Class deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = exports;
