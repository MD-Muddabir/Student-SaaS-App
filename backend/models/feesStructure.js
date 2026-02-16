const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeesStructure = sequelize.define("FeesStructure", {
    institute_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    fee_type: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
    due_date: DataTypes.DATEONLY,
    description: DataTypes.TEXT,
});

module.exports = FeesStructure;
