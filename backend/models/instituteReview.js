/**
 * Institute Review Model
 * Student testimonials/reviews for public web page
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InstituteReview = sequelize.define("InstituteReview", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    student_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    review_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    rating: {
        type: DataTypes.TINYINT,
        defaultValue: 5,
        validate: { min: 1, max: 5 }
    },
    achievement: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'institute_reviews',
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = InstituteReview;
