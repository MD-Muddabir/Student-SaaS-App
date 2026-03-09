/**
 * Webhook Controller
 * Handles Razorpay webhook events for subscription management
 */

const crypto = require("crypto");
const { Subscription, Institute, Plan } = require("../models");
const emailService = require("../services/email.service");
const invoiceService = require("../services/invoice.service");

/**
 * Handle Razorpay webhook events
 * @route POST /api/webhook
 * @access Public (but verified with signature)
 */
exports.handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];
        const body = JSON.stringify(req.body);

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook signature",
            });
        }

        const event = req.body.event;
        const subscriptionData = req.body.payload?.subscription?.entity;

        // Handle different webhook events
        switch (event) {
            case "subscription.charged":
                await handleSubscriptionCharged(subscriptionData);
                break;

            case "subscription.halted":
                await handleSubscriptionHalted(subscriptionData);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(subscriptionData);
                break;

            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
        });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
};

/**
 * Handle subscription.charged event
 * Creates subscription record and activates institute
 */
async function handleSubscriptionCharged(subscriptionData) {
    try {
        const instituteId = subscriptionData.notes?.institute_id;
        const planId = subscriptionData.plan_id;

        if (!instituteId || !planId) {
            console.error("Missing institute_id or plan_id in webhook data");
            return;
        }

        // Fetch institute and plan details
        const institute = await Institute.findByPk(instituteId);
        const plan = await Plan.findByPk(planId);

        if (!institute || !plan) {
            console.error("Institute or Plan not found");
            return;
        }

        // Create subscription record
        const newSubscription = await Subscription.create({
            institute_id: instituteId,
            plan_id: planId,
            start_date: new Date(),
            end_date: new Date(subscriptionData.current_end * 1000),
            payment_status: "paid",
            transaction_reference: subscriptionData.id,
        });

        // Update institute status
        await Institute.update(
            {
                subscription_start: new Date(),
                subscription_end: new Date(subscriptionData.current_end * 1000),
                status: "active",
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

        // Generate invoice
        try {
            const invoice = await invoiceService.generateInvoice({
                institute,
                plan,
                subscription: newSubscription,
            });

            // Update subscription with invoice path
            if (invoice && invoice.fileName) {
                await newSubscription.update({
                    invoice_path: invoice.fileName,
                });
            }

            // Send payment confirmation email with invoice
            await emailService.sendEmail(
                institute.email,
                "Payment Successful - Invoice Attached",
                `
                    <h2>Payment Received Successfully</h2>
                    <p>Dear ${institute.name},</p>
                    <p>Thank you for your payment. Your subscription has been activated.</p>
                    <p><strong>Plan:</strong> ${plan.name}</p>
                    <p><strong>Amount Paid:</strong> ₹${plan.price}</p>
                    <p><strong>Valid Until:</strong> ${new Date(subscriptionData.current_end * 1000).toLocaleDateString()}</p>
                    <p>Please find your invoice attached.</p>
                    <br>
                    <p>Best regards,<br>Student SaaS Team</p>
                `
            );
        } catch (invoiceError) {
            console.error("Invoice generation/email error:", invoiceError);
            // Don't fail the whole webhook if invoice fails
        }

        console.log(`✅ Subscription activated for institute ${instituteId}`);
    } catch (error) {
        console.error("Error handling subscription.charged:", error);
        throw error;
    }
}

/**
 * Handle subscription.halted event
 * Suspends subscription when payment fails
 */
async function handleSubscriptionHalted(subscriptionData) {
    try {
        await Subscription.update(
            { payment_status: "failed" },
            { where: { transaction_reference: subscriptionData.id } }
        );

        await Institute.update(
            { status: "suspended" },
            { where: { id: subscriptionData.notes?.institute_id } }
        );

        console.log(`⚠️ Subscription halted: ${subscriptionData.id}`);
    } catch (error) {
        console.error("Error handling subscription.halted:", error);
        throw error;
    }
}

/**
 * Handle subscription.cancelled event
 * Marks subscription as cancelled
 */
async function handleSubscriptionCancelled(subscriptionData) {
    try {
        await Subscription.update(
            { payment_status: "unpaid" },
            { where: { transaction_reference: subscriptionData.id } }
        );

        await Institute.update(
            { status: "expired" },
            { where: { id: subscriptionData.notes?.institute_id } }
        );

        console.log(`❌ Subscription cancelled: ${subscriptionData.id}`);
    } catch (error) {
        console.error("Error handling subscription.cancelled:", error);
        throw error;
    }
}

module.exports = exports;
