/**
 * Seed Plans Data
 * Creates the 3 plans: Starter, Growth, Pro
 */

const { Plan } = require("../models");

const seedPlans = async () => {
    try {
        // Check if plans already exist
        const existingPlans = await Plan.count();
        if (existingPlans > 0) {
            console.log("✅ Plans already seeded");
            return;
        }

        const plans = [
            {
                // 🥉 STARTER PLAN
                name: "Starter",
                description: "Best for small coaching centers (1-2 batches)",
                price: 999.00,

                // Limits
                max_students: 100,
                max_faculty: 5,
                max_classes: 5,
                max_admin_users: 1,

                // Core Features (Always Available)
                feature_students: true,
                feature_faculty: true,
                feature_classes: true,
                feature_subjects: true,

                // Advanced Features
                feature_attendance: 'basic',
                feature_auto_attendance: false,
                feature_fees: false,
                feature_reports: 'none',
                feature_announcements: false,
                feature_exams: false,
                feature_timetable: false,
                feature_export: false,
                feature_email: false,
                feature_sms: false,
                feature_whatsapp: false,

                // Premium Features
                feature_custom_branding: false,
                feature_multi_branch: false,
                feature_api_access: false,
                feature_parent_portal: false,
                feature_mobile_app: false,

                status: 'active',
                is_popular: false
            },
            {
                // 🥈 GROWTH PLAN (Most Popular)
                name: "Growth",
                description: "Best for growing institutes with fee management and reports",
                price: 1999.00,

                // Limits
                max_students: 500,
                max_faculty: 20,
                max_classes: 20,
                max_admin_users: 3,

                // Core Features
                feature_students: true,
                feature_faculty: true,
                feature_classes: true,
                feature_subjects: true,

                // Advanced Features
                feature_attendance: 'advanced',
                feature_auto_attendance: true,
                feature_fees: true,
                feature_reports: 'basic',
                feature_announcements: true,
                feature_exams: true,
                feature_timetable: true,
                feature_export: true,
                feature_email: true,
                feature_sms: false,
                feature_whatsapp: false,

                // Premium Features
                feature_custom_branding: false,
                feature_multi_branch: false,
                feature_api_access: false,
                feature_parent_portal: false,
                feature_mobile_app: false,

                status: 'active',
                is_popular: true // Most Popular
            },
            {
                // 🥇 PRO INSTITUTE PLAN
                name: "Pro Institute",
                description: "Best for large institutes with multi-branch support",
                price: 3999.00,

                // Limits
                max_students: 1500,
                max_faculty: 50,
                max_classes: 50,
                max_admin_users: 10,

                // Core Features
                feature_students: true,
                feature_faculty: true,
                feature_classes: true,
                feature_subjects: true,

                // Advanced Features
                feature_attendance: 'advanced',
                feature_auto_attendance: true,
                feature_fees: true,
                feature_reports: 'advanced',
                feature_announcements: true,
                feature_exams: true,
                feature_timetable: true,
                feature_export: true,
                feature_email: true,
                feature_sms: true,
                feature_whatsapp: true,

                // Premium Features
                feature_custom_branding: true,
                feature_multi_branch: true,
                feature_api_access: true,
                feature_parent_portal: true,
                feature_mobile_app: true,

                status: 'active',
                is_popular: false
            }
        ];

        await Plan.bulkCreate(plans);
        console.log("✅ Plans seeded successfully!");
        console.log("   - Starter Plan (₹999/month)");
        console.log("   - Growth Plan (₹1999/month) [Popular]");
        console.log("   - Pro Institute Plan (₹3999/month)");

    } catch (error) {
        console.error("❌ Error seeding plans:", error);
        throw error;
    }
};

module.exports = seedPlans;
