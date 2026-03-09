const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Expense = sequelize.define("Expense", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null for superadmin expenses
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'expenses',
    timestamps: true
});

module.exports = Expense;
