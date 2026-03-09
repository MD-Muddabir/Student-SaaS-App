const { sequelize } = require('./models');

async function updateDB() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");

        await sequelize.query("ALTER TABLE attendances MODIFY COLUMN status ENUM('present', 'absent', 'late', 'holiday');");
        console.log("Updated attendances table status ENUM");

        await sequelize.query("ALTER TABLE faculty_attendances MODIFY COLUMN status ENUM('present', 'absent', 'late', 'half_day', 'holiday');");
        console.log("Updated faculty_attendances table status ENUM");

        process.exit(0);
    } catch (err) {
        console.error("Error updating DB", err);
        process.exit(1);
    }
}

updateDB();
