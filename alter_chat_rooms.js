const sequelize = require("./backend/config/database");

async function alterDb() {
    try {
        await sequelize.query("ALTER TABLE chat_rooms ADD COLUMN target_gender ENUM('male', 'female', 'both') DEFAULT 'both';");
        console.log("Added target_gender successfully");
    } catch (e) {
        if (e.message.includes("Duplicate column name")) {
            console.log("Column already exists");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
}

alterDb();
