const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define("Payment", {
    institute_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    fee_structure_id: DataTypes.INTEGER,
    amount_paid: DataTypes.DECIMAL(10, 2),
    payment_date: DataTypes.DATEONLY,
    payment_method: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    status: DataTypes.ENUM("success", "failed", "pending"),
    collected_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = Payment;
