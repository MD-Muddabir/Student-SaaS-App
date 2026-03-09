const sequelize = require('./backend/config/database');

const run = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.query(`ALTER TABLE Users ADD COLUMN permissions JSON DEFAULT NULL`);
        console.log('Successfully added permissions column');
    } catch (err) {
        if (err.message.includes('Duplicate column name')) {
            console.log('Column already exists');
        } else {
            console.error('Error:', err);
        }
    } finally {
        process.exit();
    }
};
run();
