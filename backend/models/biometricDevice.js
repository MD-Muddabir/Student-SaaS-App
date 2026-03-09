const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BiometricDevice = sequelize.define("BiometricDevice", {
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    device_name: { type: DataTypes.STRING(100), allowNull: false },
    device_serial: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    device_type: {
        type: DataTypes.ENUM("fingerprint", "face", "rfid", "mobile"),
        defaultValue: "fingerprint"
    },
    location: { type: DataTypes.STRING(100) },
    ip_address: { type: DataTypes.STRING(45) },
    secret_key: { type: DataTypes.STRING(255), allowNull: false },
    status: {
        type: DataTypes.ENUM("active", "inactive", "offline"),
        defaultValue: "active"
    },
    last_sync: { type: DataTypes.DATE },
}, {
    tableName: "biometric_devices",
    timestamps: true,
    underscored: true,
});

module.exports = BiometricDevice;
