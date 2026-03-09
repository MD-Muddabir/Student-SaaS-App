const { Expense, Subscription, Payment, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getExpenses = async (req, res) => {
    try {
        const { role, institute_id } = req.user;
        const { period, dateValue } = req.query;

        const whereClause = role === "super_admin" ? { institute_id: null } : { institute_id };

        if (period === 'month' && dateValue) {
            const [year, month] = dateValue.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            whereClause.date = { [Op.between]: [startDate, endDate] };
        } else if (period === 'year' && dateValue) {
            const startDate = new Date(dateValue, 0, 1);
            const endDate = new Date(dateValue, 11, 31, 23, 59, 59);
            whereClause.date = { [Op.between]: [startDate, endDate] };
        } else if (period === 'current_month') {
            const currentDate = new Date();
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
            whereClause.date = { [Op.between]: [startDate, endDate] };
        } // 'all' requires no date filter

        const expenses = await Expense.findAll({
            where: whereClause,
            order: [["date", "DESC"]],
        });

        res.status(200).json({ success: true, expenses });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ success: false, message: "Failed to fetch expenses" });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const { title, amount, category, date, description } = req.body;
        const { role, institute_id } = req.user;

        if (!title || !amount || !category) {
            return res.status(400).json({ success: false, message: "Title, amount, and category are required" });
        }

        const expense = await Expense.create({
            institute_id: role === "super_admin" ? null : institute_id,
            title,
            amount,
            category,
            date: date || new Date(),
            description,
            created_by: req.user.id || null,
        });

        res.status(201).json({ success: true, expense, message: "Expense added successfully" });
    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ success: false, message: "Failed to add expense" });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, institute_id } = req.user;

        const whereClause = { id };
        if (role !== "super_admin") {
            whereClause.institute_id = institute_id;
        } else {
            whereClause.institute_id = null;
        }

        const deletedCount = await Expense.destroy({ where: whereClause });

        if (deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }

        res.status(200).json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ success: false, message: "Failed to delete expense" });
    }
};

exports.getExpenseStats = async (req, res) => {
    try {
        const { role, institute_id } = req.user;

        const { period, dateValue } = req.query;

        // Month calculations (Chart generation context)
        const currentDate = new Date();
        const expWhere = role === "super_admin" ? { institute_id: null } : { institute_id };

        let loopStartMonth = currentDate.getMonth();
        let loopStartYear = currentDate.getFullYear();
        let loopCount = 6;
        let isDaily = false;

        if (period === 'month' && dateValue) {
            const [y, m] = dateValue.split('-');
            loopStartYear = parseInt(y);
            loopStartMonth = parseInt(m) - 1;
            isDaily = true;
            loopCount = new Date(loopStartYear, loopStartMonth + 1, 0).getDate();
        } else if (period === 'year' && dateValue) {
            loopStartYear = parseInt(dateValue);
            loopStartMonth = 11; // December
            loopCount = 12; // Whole year
        } else if (period === 'all') {
            loopCount = 12; // Let's show last 12 months for 'all'
        } else {
            // Default: current_month
            isDaily = true;
            loopCount = new Date(loopStartYear, loopStartMonth + 1, 0).getDate();
        }

        // Generate historical data array
        const chartData = [];

        if (isDaily) {
            for (let i = 1; i <= loopCount; i++) {
                const dayStart = new Date(loopStartYear, loopStartMonth, i);
                const dayEnd = new Date(loopStartYear, loopStartMonth, i, 23, 59, 59);
                const dayLabel = dayStart.toLocaleString('default', { day: 'numeric', month: 'short' });

                const mExpWhere = { ...expWhere, date: { [Op.between]: [dayStart, dayEnd] } };
                const mExpense = await Expense.sum("amount", { where: mExpWhere }) || 0;

                let mIncome = 0;
                if (role === "super_admin") {
                    mIncome = await Subscription.sum("amount_paid", {
                        where: { payment_status: "paid", createdAt: { [Op.between]: [dayStart, dayEnd] } }
                    }) || 0;
                } else {
                    mIncome = await Payment.sum("amount_paid", {
                        where: {
                            institute_id,
                            status: "success",
                            payment_date: { [Op.between]: [dayStart, dayEnd] }
                        }
                    }) || 0;
                }

                chartData.push({ month: dayLabel, income: mIncome, expense: mExpense });
            }
        } else {
            for (let i = loopCount - 1; i >= 0; i--) {
                const d = new Date(loopStartYear, loopStartMonth - i, 1);
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
                const monthLabel = period === 'year' ? d.toLocaleString('default', { month: 'short' }) : d.toLocaleString('default', { month: 'short', year: '2-digit' });

                const mExpWhere = { ...expWhere, date: { [Op.between]: [monthStart, monthEnd] } };
                const mExpense = await Expense.sum("amount", { where: mExpWhere }) || 0;

                let mIncome = 0;
                if (role === "super_admin") {
                    mIncome = await Subscription.sum("amount_paid", {
                        where: { payment_status: "paid", createdAt: { [Op.between]: [monthStart, monthEnd] } }
                    }) || 0;
                } else {
                    mIncome = await Payment.sum("amount_paid", {
                        where: {
                            institute_id,
                            status: "success",
                            payment_date: { [Op.between]: [monthStart, monthEnd] }
                        }
                    }) || 0;
                }

                chartData.push({ month: monthLabel, income: mIncome, expense: mExpense });
            }
        }

        let dateFilter = null;
        let subDateFilter = null;

        if (period === 'month' && dateValue) {
            const [year, month] = dateValue.split('-');
            dateFilter = { [Op.between]: [new Date(year, month - 1, 1), new Date(year, month, 0, 23, 59, 59)] };
            subDateFilter = { [Op.between]: [new Date(year, month - 1, 1), new Date(year, month, 0, 23, 59, 59)] };
        } else if (period === 'year' && dateValue) {
            dateFilter = { [Op.between]: [new Date(dateValue, 0, 1), new Date(dateValue, 11, 31, 23, 59, 59)] };
            subDateFilter = { [Op.between]: [new Date(dateValue, 0, 1), new Date(dateValue, 11, 31, 23, 59, 59)] };
        } else if (period === 'all') {
            dateFilter = null;
            subDateFilter = null;
        } else {
            // Default to current_month
            const currentStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const currentEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
            dateFilter = { [Op.between]: [currentStart, currentEnd] };
            subDateFilter = { [Op.between]: [currentStart, currentEnd] };
        }

        if (dateFilter) expWhere.date = dateFilter;

        // 1. Total Expenses
        const expensesTotal = await Expense.sum("amount", { where: expWhere }) || 0;

        // 2. Total Income
        let incomeTotal = 0;
        if (role === "super_admin") {
            const subWhere = { payment_status: "paid" };
            if (subDateFilter) subWhere.createdAt = subDateFilter;
            incomeTotal = await Subscription.sum("amount_paid", { where: subWhere }) || 0;
        } else {
            const payWhere = { institute_id, status: "success" };
            if (subDateFilter) payWhere.payment_date = subDateFilter;
            incomeTotal = await Payment.sum("amount_paid", { where: payWhere }) || 0;
        }

        const profitLoss = incomeTotal - expensesTotal;
        const burnRate = expensesTotal;

        res.status(200).json({
            success: true,
            stats: {
                totalExpense: expensesTotal,
                totalIncome: incomeTotal,
                profitLoss,
                burnRate
            },
            chartData
        });

    } catch (error) {
        console.error("Error fetching expense stats:", error);
        res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
};
