const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Class = sequelize.define("Class", {
    institute_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    section: DataTypes.STRING,
}, {
    tableName: 'classes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Class;
