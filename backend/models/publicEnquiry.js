/**
 * Public Enquiry Model
 * Stores enquiry form submissions from public web page
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PublicEnquiry = sequelize.define("PublicEnquiry", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING(80),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    mobile: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    course_interest: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    current_class: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('new', 'contacted', 'enrolled', 'closed'),
        defaultValue: 'new'
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'public_enquiries',
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = PublicEnquiry;
