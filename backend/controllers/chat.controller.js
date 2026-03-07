const { ChatRoom, ChatMessage, ChatParticipant, User, Faculty, Student, Class, Subject, StudentSubject } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");

// ─── HELPERS ──────────────────────────────────────────────────────────────

async function ensureParticipant(room_id, user_id, role) {
    const exists = await ChatParticipant.findOne({ where: { room_id, user_id } });
    if (!exists) {
        await ChatParticipant.create({ room_id, user_id, role });
    }
}

// Ensure the direct room exists between a student and a faculty for a specific subject
async function getOrCreateDirectRoom(institute_id, student_user_id, faculty_user_id, subject_id, class_id) {
    const existingRooms = await ChatRoom.findAll({
        where: {
            institute_id,
            type: "direct",
            subject_id: subject_id || null,
        },
        include: [{
            model: ChatParticipant,
        }]
    });

    let room = null;
    if (student_user_id && faculty_user_id) {
        room = existingRooms.find(r => {
            if (!r.ChatParticipants) return false;
            const pIds = r.ChatParticipants.map(p => Number(p.user_id));
            return pIds.includes(Number(student_user_id)) &&
                pIds.includes(Number(faculty_user_id)) &&
                pIds.length === 2;
        });
    }

    if (!room) {
        // Create new direct room
        room = await ChatRoom.create({
            institute_id,
            type: "direct",
            subject_id: subject_id || null,
            class_id: class_id || null,
            name: "Direct Chat",
            target_gender: "both"
        });
        await ensureParticipant(room.id, student_user_id, "student");
        if (faculty_user_id) await ensureParticipant(room.id, faculty_user_id, "faculty");
    }
    return room;
}

// ─── ENDPOINTS ──────────────────────────────────────────────────────────────

// 1. Create Room (For Faculty)
exports.createRoom = async (req, res) => {
    try {
        const { role: userRole, id: userId, institute_id } = req.user;
        const { subject_id, class_id, audience, name } = req.body;

        if (userRole !== "faculty") {
            return res.status(403).json({ success: false, message: "Only faculty can create group rooms." });
        }
        if (!subject_id || !audience || !name) {
            return res.status(400).json({ success: false, message: "subject_id, target audience and room name required" });
        }

        const faculty = await Faculty.findOne({ where: { user_id: userId } });
        if (!faculty) return res.status(404).json({ success: false, message: "Faculty record not found" });

        // target_gender: audience handles 'boys', 'girls', 'both'
        let targetGender = 'both';
        if (audience.toLowerCase() === 'boys') targetGender = 'male';
        if (audience.toLowerCase() === 'girls') targetGender = 'female';

        const newRoom = await ChatRoom.create({
            institute_id,
            class_id: class_id || null,
            subject_id,
            faculty_id: faculty.id,
            type: "group",
            name,
            target_gender: targetGender
        });

        // Add faculty to participant
        await ensureParticipant(newRoom.id, userId, userRole);

        return res.status(201).json({ success: true, message: "Room created successfully", room: newRoom });
    } catch (err) {
        console.error("createRoom:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Delete Room (For Faculty or Admin)
exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { role: userRole, id: userId, institute_id } = req.user;

        const room = await ChatRoom.findOne({ where: { id: roomId, institute_id } });
        if (!room) return res.status(404).json({ success: false, message: "Room not found" });

        // Ensure permission
        if (userRole === "faculty") {
            const faculty = await Faculty.findOne({ where: { user_id: userId } });
            if (!faculty || room.faculty_id !== faculty.id) {
                return res.status(403).json({ success: false, message: "You can only delete your own rooms." });
            }
        } else if (userRole !== "admin" && userRole !== "owner") {
            return res.status(403).json({ success: false, message: "Access denied." });
        }

        // Delete dependencies (messages, participants)
        await ChatParticipant.destroy({ where: { room_id: room.id } });
        await ChatMessage.destroy({ where: { room_id: room.id } });
        await room.destroy();

        return res.status(200).json({ success: true, message: "Room deleted successfully." });
    } catch (err) {
        console.error("deleteRoom:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Send Message
exports.sendMessage = async (req, res) => {
    try {
        const { room_id, message } = req.body;
        const { role: userRole, id: userId, institute_id } = req.user;

        if (!room_id) return res.status(400).json({ success: false, message: "room_id required" });
        if (!message && !req.file) return res.status(400).json({ success: false, message: "message or file required" });

        const room = await ChatRoom.findOne({ where: { id: room_id, institute_id } });
        if (!room) return res.status(404).json({ success: false, message: "Room not found" });

        if (userRole !== "admin" && userRole !== "owner") {
            await ensureParticipant(room_id, userId, userRole);
        }

        const newMsg = await ChatMessage.create({
            room_id,
            sender_id: userId,
            sender_role: userRole,
            message: message || null,
            attachment_url: req.file ? `/uploads/notes/${req.file.filename}` : null,
            attachment_type: req.file ? req.file.mimetype : null,
        });

        // Anonymous feature applied at fetch-time, just return success
        return res.status(201).json({ success: true });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("sendMessage:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Get Rooms
exports.getRooms = async (req, res) => {
    try {
        const { id: userId, role: userRole, institute_id } = req.user;

        async function enhanceAndSortRooms(roomsArray) {
            const result = [];
            for (const r of roomsArray) {
                const rData = r.toJSON();
                const msgCount = await ChatMessage.count({ where: { room_id: r.id } });
                const lastMsg = await ChatMessage.findOne({
                    where: { room_id: r.id },
                    order: [['created_at', 'DESC']],
                    attributes: ['created_at']
                });
                rData.message_count = msgCount;
                rData.last_message_at = lastMsg ? lastMsg.created_at : r.created_at;
                result.push(rData);
            }
            result.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            return result;
        }

        const roomInclude = [
            { model: Class, attributes: ["id", "name", "section"] },
            { model: Subject, attributes: ["id", "name"] },
            {
                model: Faculty,
                attributes: ["id", "user_id"],
                include: [{ model: User, attributes: ["id", "name"] }],
                required: false,
            },
            {
                model: ChatParticipant,
                attributes: ["user_id", "role"],
                include: [{ model: User, attributes: ["id", "name"] }],
                required: false,
            }
        ];

        // ── Admin / Manager ── sees all rooms
        if (userRole === "admin" || userRole === "owner" || userRole === "manager") {
            const rooms = await ChatRoom.findAll({
                where: { institute_id },
                include: roomInclude,
            });
            const enhancedRooms = await enhanceAndSortRooms(rooms);
            return res.status(200).json({ success: true, count: enhancedRooms.length, data: enhancedRooms });
        }

        let roomIds = [];

        // ── Faculty ── sees rooms they created + direct rooms they participate in
        if (userRole === "faculty") {
            const faculty = await Faculty.findOne({ where: { user_id: userId, institute_id } });
            if (faculty) {
                // Rooms created by this faculty
                const createdRooms = await ChatRoom.findAll({ where: { faculty_id: faculty.id, institute_id } });
                createdRooms.forEach(r => roomIds.push(r.id));
            }
        }

        // ── Student ── sees rooms matching their subjects and target gender + direct rooms 
        if (userRole === "student") {
            const student = await Student.findOne({
                where: { user_id: userId, institute_id },
                include: [
                    { model: Subject, through: { attributes: [] }, attributes: ["id"] },
                    { model: Class, through: { attributes: [] }, attributes: ["id"] },
                ],
            });

            if (student) {
                let subIds = student.Subjects?.map(s => s.id) || [];
                const classIds = student.Classes?.map(c => c.id) || [];
                const sGender = student.gender || "none";

                // If no subjects explicitly registered, fetch all subjects for their classes
                if (subIds.length === 0 && classIds.length > 0) {
                    const classSubjects = await Subject.findAll({ where: { class_id: { [Op.in]: classIds } } });
                    subIds = classSubjects.map(s => s.id);
                }

                // Group rooms matching subject AND target gender
                const eligibleRooms = await ChatRoom.findAll({
                    where: {
                        institute_id,
                        type: { [Op.in]: ["group", "subject"] },
                        target_gender: { [Op.in]: ["both", sGender] },
                        [Op.or]: [
                            { subject_id: { [Op.in]: subIds } },
                            { subject_id: null, class_id: { [Op.in]: classIds } }
                        ]
                    }
                });

                eligibleRooms.forEach(r => roomIds.push(r.id));
            }
        }

        // Fetch joined rooms
        const myParticipatedRooms = await ChatRoom.findAll({
            include: [{
                model: ChatParticipant,
                where: { user_id: userId },
                attributes: []
            }],
            attributes: ["id", "type", "subject_id", "class_id"]
        });

        myParticipatedRooms.forEach(r => {
            if (userRole === "student" && r.type !== "direct") {
                // Students only see group rooms if eligible (added above). 
                // Direct chats are explicitly kept.
                return;
            }
            roomIds.push(r.id);
        });

        // Deduplicate
        roomIds = [...new Set(roomIds)];

        if (!roomIds.length) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // Fetch the full room data
        const rooms = await ChatRoom.findAll({
            where: { id: roomIds, institute_id },
            include: roomInclude,
        });

        const enhancedRooms = await enhanceAndSortRooms(rooms);
        return res.status(200).json({ success: true, count: enhancedRooms.length, data: enhancedRooms });
    } catch (err) {
        console.error("getRooms:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Get Room Messages (with Anonymity)
exports.getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { id: userId, role: userRole, institute_id } = req.user;

        const room = await ChatRoom.findOne({ where: { id: roomId, institute_id } });
        if (!room) return res.status(404).json({ success: false, message: "Room not found" });

        // Auto-join non-admins
        if (userRole !== "admin" && userRole !== "owner") {
            await ensureParticipant(roomId, userId, userRole);
        }

        let messages = await ChatMessage.findAll({
            where: { room_id: roomId },
            include: [{
                model: User,
                as: "sender",
                attributes: ["id", "name", "role"],
                include: [{ model: Student, attributes: ["gender"] }]
            }],
            order: [["created_at", "ASC"]],
        });

        // Apply Phase 4 logic: Anonymize student names if it's a "group" chat
        if ((room.type === "group" || room.type === "subject") && userRole === "student") {
            messages = messages.map(msg => {
                const plainMsg = msg.get({ plain: true });
                if (plainMsg.sender && plainMsg.sender.role === "student") {
                    // Phase 4: DO NOT show other students' names or roles to students in group chats
                    plainMsg.sender.name = "";
                    plainMsg.sender.is_hidden_student = true;
                }
                return plainMsg;
            });
        }

        return res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        console.error("getRoomMessages:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Get or Create Direct Room (Phase 3: Student starting direct chat)
exports.getOrCreateRoom = async (req, res) => {
    try {
        const { type, subject_id, class_id, faculty_user_id } = req.body;
        const { id: userId, role: userRole, institute_id } = req.user;

        // Ensure this endpoint creates Direct chats
        let room;
        if (type === "direct" && userRole === "student") {
            let fid = faculty_user_id;
            if (!fid && subject_id) {
                const subject = await Subject.findOne({ where: { id: subject_id }, include: [Faculty] });
                if (subject && subject.Faculty) {
                    fid = subject.Faculty.user_id;
                }
            }
            room = await getOrCreateDirectRoom(institute_id, userId, fid, subject_id, class_id);
        } else {
            // General fallback
            let whereClause = { institute_id, type: type || "subject" };
            if (subject_id) whereClause.subject_id = subject_id;

            room = await ChatRoom.findOne({ where: whereClause });
            if (!room) {
                room = await ChatRoom.create({
                    institute_id, type: type || "subject", subject_id, class_id, target_gender: "both"
                });
            }
            await ensureParticipant(room.id, userId, userRole);
        }

        return res.status(200).json({ success: true, room });
    } catch (err) {
        console.error("getOrCreateRoom:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 7. Get Room Participants (with Anonymity)
exports.getRoomParticipants = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { institute_id } = req.user;

        const room = await ChatRoom.findOne({ where: { id: roomId, institute_id } });
        if (!room) return res.status(404).json({ success: false, message: "Room not found" });

        let participants = await ChatParticipant.findAll({
            where: { room_id: roomId },
            include: [{
                model: User,
                attributes: ["id", "name", "role"],
                include: [{ model: Student, attributes: ["gender"] }]
            }],
        });

        // Apply anonymity same as messages
        if ((room.type === "group" || room.type === "subject") && userRole === "student") {
            participants = participants.map(p => {
                const plainP = p.get({ plain: true });
                if (plainP.User && plainP.User.role === "student") {
                    const g = plainP.User.Student?.gender;
                    if (g === "female") plainP.User.name = "Female Student";
                    else if (g === "male") plainP.User.name = "Male Student";
                    else plainP.User.name = "Student";
                }
                return plainP;
            });
        }

        return res.status(200).json({ success: true, data: participants });
    } catch (err) {
        console.error("getRoomParticipants:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
