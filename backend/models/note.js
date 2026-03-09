const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Note = sequelize.define("Note", {
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
    faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "faculty",
            key: "id",
        },
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "classes",
            key: "id",
        },
    },
    subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "subjects",
            key: "id",
        },
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    file_type: {
        type: DataTypes.STRING, // e.g., 'pdf', 'docx', 'image/png'
        allowNull: true,
    },
    file_size: {
        type: DataTypes.INTEGER, // in bytes
        allowNull: true,
    },
}, {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    tableName: "notes"
});

module.exports = Note;
