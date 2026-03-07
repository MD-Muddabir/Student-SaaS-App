const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    institute_id: DataTypes.INTEGER,
    role: DataTypes.ENUM("super_admin", "admin", "manager", "faculty", "student", "parent"),
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: 'unique_user_email' },
    phone: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    status: DataTypes.ENUM("active", "blocked"),
    theme_dark: { type: DataTypes.BOOLEAN, defaultValue: false },
    theme_style: { type: DataTypes.ENUM("simple", "pro"), defaultValue: "simple" },
    permissions: { type: DataTypes.JSON, defaultValue: null },
    last_announcement_seen_at: { type: DataTypes.DATE, defaultValue: null },
});

module.exports = User;
