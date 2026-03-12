/**
 * Institute Gallery Photo Model
 * Stores gallery photos for public web page
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InstituteGalleryPhoto = sequelize.define("InstituteGalleryPhoto", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    photo_url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    label: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'institute_gallery_photos',
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = InstituteGalleryPhoto;
