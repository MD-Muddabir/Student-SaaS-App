const fs = require("fs");
const path = require("path");
const { Note, NoteDownload, Faculty, Subject, Class, User } = require("../models");

// 1. Upload a note
exports.uploadNote = async (req, res) => {
    try {
        const { user } = req;

        // User must be a faculty to upload notes
        if (user.role !== "faculty") {
            return res.status(403).json({ success: false, message: "Only faculty can upload notes" });
        }

        const faculty = await Faculty.findOne({ where: { user_id: user.id } });
        if (!faculty) {
            return res.status(404).json({ success: false, message: "Faculty record not found" });
        }

        const { title, description, class_id, subject_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "File is required" });
        }

        // Input validation
        if (!title || !class_id || !subject_id) {
            // Remove uploaded file if validation fails
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: "Title, class_id, and subject_id are required" });
        }

        // Checking if class and subject are valid/exist could be added here

        const newNote = await Note.create({
            institute_id: user.institute_id,
            faculty_id: faculty.id,
            class_id: class_id,
            subject_id: subject_id,
            title: title,
            description: description || "",
            file_url: `/uploads/notes/${req.file.filename}`,
            file_type: req.file.mimetype,
            file_size: req.file.size
        });

        res.status(201).json({
            success: true,
            message: "Note uploaded successfully",
            note: newNote
        });

    } catch (error) {
        console.error("Upload note error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// 2. Get notes by class
exports.getNotesByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const notes = await Note.findAll({
            where: { class_id: classId, institute_id: req.user.institute_id },
            include: [
                { model: Faculty, attributes: ['id', 'user_id'], include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
                { model: Subject, attributes: ['id', 'name'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, count: notes.length, data: notes });
    } catch (error) {
        console.error("Get notes by class error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// 3. Get notes by subject
exports.getNotesBySubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const notes = await Note.findAll({
            where: { subject_id: subjectId, institute_id: req.user.institute_id },
            include: [
                { model: Faculty, attributes: ['id', 'user_id'], include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
                { model: Class, attributes: ['id', 'name'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, count: notes.length, data: notes });
    } catch (error) {
        console.error("Get notes by subject error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// 4. Delete a note
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        const note = await Note.findOne({ where: { id: id, institute_id: req.user.institute_id } });

        if (!note) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        // Check permissions
        if (userRole === "faculty") {
            const faculty = await Faculty.findOne({ where: { user_id: req.user.id } });
            if (note.faculty_id !== faculty.id) {
                return res.status(403).json({ success: false, message: "You can only delete your own notes" });
            }
        } else if (userRole !== "admin" && userRole !== "owner" && userRole !== "manager") {
            return res.status(403).json({ success: false, message: "You do not have permission to delete this note" });
        }

        // Delete the file from the filesystem
        const filePath = path.join(__dirname, "..", "..", note.file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await note.destroy();

        res.status(200).json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// 5. Get all notes (for admin)
exports.getAllNotes = async (req, res) => {
    try {
        const notes = await Note.findAll({
            where: { institute_id: req.user.institute_id },
            include: [
                { model: Faculty, attributes: ['id', 'user_id'], include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
                { model: Subject, attributes: ['id', 'name'] },
                { model: Class, attributes: ['id', 'name'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ success: true, count: notes.length, data: notes });
    } catch (error) {
        console.error("Get all notes error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// 6. Record note download
exports.recordDownload = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the user is a student
        if (req.user.role === 'student') {
            const { Student } = require('../models');
            const student = await Student.findOne({ where: { user_id: req.user.id } });

            if (student) {
                // Record download
                await NoteDownload.create({
                    note_id: id,
                    student_id: student.id
                });
            }
        }

        res.status(200).json({ success: true, message: "Download recorded" });
    } catch (error) {
        console.error("Record download error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
