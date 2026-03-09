const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NoteDownload = sequelize.define("NoteDownload", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    note_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "notes",
            key: "id",
        },
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "students",
            key: "id",
        },
    },
}, {
    timestamps: true,
    createdAt: "downloaded_at",
    updatedAt: false,
    tableName: "notes_downloads"
});

module.exports = NoteDownload;
