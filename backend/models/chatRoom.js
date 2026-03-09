const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChatRoom = sequelize.define("ChatRoom", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "institutes",
            key: "id",
        },
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "classes",
            key: "id",
        },
    },
    subject_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "subjects",
            key: "id",
        },
    },
    faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "faculty",
            key: "id",
        },
    },
    type: {
        type: DataTypes.ENUM("subject", "group", "direct"),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING, // To give a name if needed like 'Maths Class 10A'
        allowNull: true,
    },
    target_gender: {
        type: DataTypes.ENUM("male", "female", "both"),
        defaultValue: "both",
    }
}, {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // We only need created_at according to specs
    tableName: "chat_rooms"
});

module.exports = ChatRoom;
