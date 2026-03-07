const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const chatController = require("../controllers/chat.controller");
const { uploadNote } = require("../utils/upload");

// Send a message
router.post(
    "/send",
    authMiddleware,
    (req, res, next) => {
        // Optionally accept file attachments
        uploadNote.single("attachment")(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            next();
        });
    },
    chatController.sendMessage
);

// Get chat rooms
router.get("/rooms", authMiddleware, chatController.getRooms);

// Get messages in a specific room
router.get("/room/:roomId", authMiddleware, chatController.getRoomMessages);

// Get participants of a room
router.get("/room/:roomId/participants", authMiddleware, chatController.getRoomParticipants);

// Get or Create Direct/Subject/Group chat room directly
router.post("/room/get-or-create", authMiddleware, chatController.getOrCreateRoom);

// Create a new room (Faculty Dashboard)
router.post("/room/create", authMiddleware, chatController.createRoom);

// Delete a room
router.delete("/room/:roomId", authMiddleware, chatController.deleteRoom);

module.exports = router;
