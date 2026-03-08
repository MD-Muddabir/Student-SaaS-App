const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentParent = sequelize.define("StudentParent", {
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    parent_id: { type: DataTypes.INTEGER, allowNull: false },
    relationship: { type: DataTypes.ENUM("father", "mother", "guardian"), allowNull: false }
});

module.exports = StudentParent;
