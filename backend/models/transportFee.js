const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransportFee = sequelize.define("TransportFee", {
    institute_id: DataTypes.INTEGER,
    route_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fee_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

module.exports = TransportFee;
