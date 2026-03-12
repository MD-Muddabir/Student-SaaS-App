/**
 * Institute Public Profile Model
 * Stores public web page data for each institute
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const InstitutePublicProfile = sequelize.define("InstitutePublicProfile", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true
    },
    is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tagline: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    about_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    cover_photo_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    established_year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    affiliation: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    pass_rate: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    competitive_selections: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    years_of_excellence: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    total_students_display: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    whatsapp_number: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    map_embed_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    working_hours: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    admission_status: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    enrollment_benefits: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    usp_points: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    social_facebook: {
        type: DataTypes.STRING(300),
        allowNull: true
    },
    social_instagram: {
        type: DataTypes.STRING(300),
        allowNull: true
    },
    social_youtube: {
        type: DataTypes.STRING(300),
        allowNull: true
    },
    theme_color: {
        type: DataTypes.STRING(10),
        defaultValue: '0F2340'
    },
    seo_title: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    seo_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    footer_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Contact fields (stored here for easy public access)
    contact_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    contact_email: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    // Faculty & Course visibility (JSON arrays of selected IDs)
    selected_faculty_ids: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    selected_subject_ids: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    // Page view counter
    page_views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'institute_public_profiles',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = InstitutePublicProfile;
