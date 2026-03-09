const { Institute, Plan } = require('./models');

const fixTimetable = async () => {
    try {
        const plans = await Plan.findAll();
        const planMap = {};
        for (const plan of plans) {
            planMap[plan.id] = plan.feature_timetable;
        }

        const institutes = await Institute.findAll();
        let updated = 0;

        for (const institute of institutes) {
            if (institute.plan_id && planMap[institute.plan_id] !== undefined) {
                // Force the timetable feature based on the current assigned plan
                await institute.update({ current_feature_timetable: planMap[institute.plan_id] });
                updated++;
            }
        }
        console.log(`Successfully retro-fitted timetable features for ${updated} existing institutes.`);
    } catch (err) {
        console.error("Error updating institutes:", err);
    } finally {
        process.exit();
    }
};

fixTimetable();
