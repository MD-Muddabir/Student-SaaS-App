const { sequelize } = require('./models');

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection established.");
        console.log("Altering database schema...");
        await sequelize.sync({ alter: true });
        console.log("Database schema successfully altered!");
    } catch (error) {
        console.error("Database schema alteration error:", error);
    } finally {
        process.exit();
    }
};

syncDatabase();
