/**
 * Migration: Add new columns to institute_public_profiles
 * Phases: course_mode, manual_courses, youtube_intro_url, faculty_images
 */

const sequelize = require('../config/database');

async function addColumnIfNotExists(tableName, columnName, columnDef) {
    try {
        await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`✅ Added column: ${columnName}`);
    } catch (err) {
        if (err.original && (err.original.errno === 1060 || err.original.code === 'ER_DUP_FIELDNAME')) {
            console.log(`⚠ Column already exists: ${columnName} (skipped)`);
        } else {
            throw err;
        }
    }
}

async function migrate() {
    console.log('📦 Running Public Page v2 Migration...\n');

    try {
        await addColumnIfNotExists(
            'institute_public_profiles',
            'course_mode',
            `VARCHAR(10) NOT NULL DEFAULT 'auto'`
        );

        await addColumnIfNotExists(
            'institute_public_profiles',
            'manual_courses',
            `JSON NULL`
        );

        await addColumnIfNotExists(
            'institute_public_profiles',
            'youtube_intro_url',
            `VARCHAR(500) NULL`
        );

        await addColumnIfNotExists(
            'institute_public_profiles',
            'faculty_images',
            `JSON NULL`
        );

        console.log('\n🎉 Migration complete! All columns are ready.');
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

migrate();
