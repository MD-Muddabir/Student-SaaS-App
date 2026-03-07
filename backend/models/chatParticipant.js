const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChatParticipant = sequelize.define("ChatParticipant", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "chat_rooms",
            key: "id",
        },
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false, // Typically no timestamps needed for simple mapping
    tableName: "chat_participants"
});

module.exports = ChatParticipant;
