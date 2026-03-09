const { Plan, Subscription, Institute, Payment } = require("../models");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_1234567890",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_secret"
});

/**
 * Initiate Payment (Create Order)
 */
exports.initiatePayment = async (req, res) => {
    try {
        const { planId, billingCycle } = req.body;
        const userId = req.user.id;
        const instituteId = req.user.institute_id;

        const plan = await Plan.findByPk(planId);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        // Calculate amount
        let amount = Number(plan.price);
        if (billingCycle === 'yearly') {
            amount = amount * 12 * 0.8; // 20% discount
        }

        // ensure amount is integer for Razorpay (in paise)
        const amountInPaise = Math.round(amount * 100);

        // Create Order
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${Date.now()}_${instituteId}`,
            notes: {
                institute_id: instituteId,
                plan_id: planId,
                billing_cycle: billingCycle
            }
        };

        try {
            const order = await razorpay.orders.create(options);
            res.json({
                success: true,
                order,
                key: process.env.RAZORPAY_KEY_ID || "rzp_test_1234567890"
            });
        } catch (rzpError) {
            console.error("Razorpay Error:", rzpError);
            // Fallback for development if no keys
            if (process.env.NODE_ENV !== 'production') {
                return res.json({
                    success: true,
                    order: {
                        id: `order_mock_${Date.now()}`,
                        amount: amountInPaise,
                        currency: "INR"
                    },
                    key: "rzp_test_mock"
                });
            }
            throw rzpError;
        }

    } catch (error) {
        console.error("Payment initiation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Verify Payment and Update Subscription
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;
        const instituteId = req.user.institute_id;

        // Verify Signature (Skip if mock)
        if (razorpay_order_id.startsWith("order_mock_")) {
            // Mock verification successful
        } else {
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mock_secret")
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ success: false, message: "Invalid payment signature" });
            }
        }

        // 1. Create Payment Record
        const payment = await Payment.create({
            institute_id: instituteId,
            student_id: null, // Institute payment
            amount: 0, // Will update below
            payment_date: new Date(),
            payment_method: "online",
            transaction_id: razorpay_payment_id,
            status: "success",
            type: "subscription_fee"
        });

        // 2. Update/Create Subscription
        const plan = await Plan.findByPk(planId);

        let amount = Number(plan.price);
        let durationMonths = 1;
        if (billingCycle === 'yearly') {
            amount = amount * 12 * 0.8;
            durationMonths = 12;
        }

        await payment.update({ amount: amount });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        await Subscription.create({
            institute_id: instituteId,
            plan_id: planId,
            start_date: startDate,
            end_date: endDate,
            payment_status: "paid",
            transaction_reference: razorpay_payment_id,
            amount_paid: amount
        });

        // 3. Activate Institute
        await Institute.update(
            {
                status: "active",
                plan_id: planId,
                subscription_start: startDate,
                subscription_end: endDate,
                // Update Snapshot Limits to New Plan Limits
                current_limit_students: plan.max_students,
                current_limit_faculty: plan.max_faculty,
                current_limit_classes: plan.max_classes,
                current_limit_admins: plan.max_admin_users,

                // Update Snapshot Features
                current_feature_attendance: plan.feature_attendance,
                current_feature_auto_attendance: plan.feature_auto_attendance,
                current_feature_fees: plan.feature_fees,
                current_feature_reports: plan.feature_reports,
                current_feature_announcements: plan.feature_announcements,
                current_feature_export: plan.feature_export,
                current_feature_timetable: plan.feature_timetable,
                current_feature_whatsapp: plan.feature_whatsapp,
                current_feature_custom_branding: plan.feature_custom_branding,
                current_feature_multi_branch: plan.feature_multi_branch,
                current_feature_api_access: plan.feature_api_access,
            },
            { where: { id: instituteId } }
        );

        res.json({
            success: true,
            message: "Payment successful and subscription activated",
            data: {
                redirect: "/admin/dashboard"
            }
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};