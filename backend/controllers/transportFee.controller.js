const { TransportFee, User } = require("../models");

/**
 * GET /api/transport-fees
 * List all transport routes for the institute
 */
exports.getAllTransportFees = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;
        const fees = await TransportFee.findAll({
            where: { institute_id },
            include: [{ model: User, as: "creator", attributes: ["name"] }],
            order: [["createdAt", "DESC"]]
        });
        res.status(200).json({ success: true, data: fees });
    } catch (err) {
        console.error("Get transport fees error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/transport-fees
 * Create a new transport route + fee
 */
exports.createTransportFee = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;
        const { route_name, fee_amount } = req.body;

        if (!route_name || !fee_amount) {
            return res.status(400).json({ success: false, message: "Route name and fee amount are required." });
        }

        const fee = await TransportFee.create({
            institute_id,
            route_name,
            fee_amount,
            created_by: req.user.id
        });

        res.status(201).json({ success: true, message: "Transport fee created.", data: fee });
    } catch (err) {
        console.error("Create transport fee error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/transport-fees/:id
 * Update a transport fee
 */
exports.updateTransportFee = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;
        const { id } = req.params;
        const { route_name, fee_amount } = req.body;

        const fee = await TransportFee.findOne({ where: { id, institute_id } });
        if (!fee) return res.status(404).json({ success: false, message: "Transport fee not found." });

        await fee.update({ route_name, fee_amount });
        res.status(200).json({ success: true, message: "Transport fee updated.", data: fee });
    } catch (err) {
        console.error("Update transport fee error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * DELETE /api/transport-fees/:id
 * Delete a transport fee
 */
exports.deleteTransportFee = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;
        const { id } = req.params;

        const deleted = await TransportFee.destroy({ where: { id, institute_id } });
        if (!deleted) return res.status(404).json({ success: false, message: "Transport fee not found." });

        res.status(200).json({ success: true, message: "Transport fee deleted." });
    } catch (err) {
        console.error("Delete transport fee error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
