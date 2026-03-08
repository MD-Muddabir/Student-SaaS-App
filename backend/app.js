/**
 * Main Application File
 * Configures Express server with middleware, routes, and error handling
 * Implements multi-tenant SaaS architecture for coaching institutes
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ============================================
// GLOBAL MIDDLEWARE SETUP
// ============================================

/**
 * CORS Configuration
 * Allows cross-origin requests from frontend
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

/**
 * Body Parsers
 * Parse JSON and URL-encoded data
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Static Files
 * Serve uploaded files
 */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * Request Logger Middleware
 * Logs all incoming requests with timestamp
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// API ROUTES
// ============================================

/**
 * Health Check Endpoint
 * Returns server status
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🎓 Student SaaS API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 * All routes are prefixed with /api
 */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/superadmin", require("./routes/superadmin.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/institutes", require("./routes/institute.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/faculty", require("./routes/faculty.routes"));
app.use("/api/faculty-attendance", require("./routes/facultyAttendance.routes"));
app.use("/api/classes", require("./routes/class.routes"));
app.use("/api/subjects", require("./routes/subject.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/reports", require("./routes/reports.routes"));
app.use("/api/exams", require("./routes/exam.routes"));
app.use("/api/fees", require("./routes/fees.routes"));
app.use("/api/announcements", require("./routes/announcement.routes"));
app.use("/api/subscriptions", require("./routes/subscription.routes"));
app.use("/api/plans", require("./routes/plan.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/invoice", require("./routes/invoice.routes"));
app.use("/api/expenses", require("./routes/expense.routes"));
app.use("/api/transport-fees", require("./routes/transportFee.routes"));
app.use("/api/manager", require("./routes/manager.routes"));
app.use("/api/timetable", require("./routes/timetable.routes"));
app.use("/api/webhook", require("./routes/webhook.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/parents", require("./routes/parent.routes"));

// ============================================
// 404 HANDLER
// ============================================

/**
 * Handle undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.url,
  });
});

// ============================================
// GLOBAL ERROR HANDLER 
// ============================================

/**
 * Central Error Handling Middleware
 * Catches all errors and returns standardized response
 */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry",
      field: err.errors[0]?.path,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// DATABASE SYNCHRONIZATION
// ============================================

/**
 * Sync database models
 * Creates tables if they don't exist
 * Use { alter: true } in development, { force: false } in production
 */

// Creation Logic: The command that actually creates or updates the tables in the database
const { sequelize } = require("./models");

const syncDatabase = async () => {
  try {
    // Test database connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // ─────────────────────────────────────────────────────────────────
    // AUTO-CLEANUP: Drop duplicate indexes before syncing.
    // Sequelize's alter:true was adding a new copy of every index on
    // every restart, quickly hitting MySQL's 64-key limit.
    // This cleanup runs on every startup and is a no-op when clean.
    // ─────────────────────────────────────────────────────────────────
    try {
      const DB_NAME = process.env.DB_NAME || "student_saas";

      // Get tables with too many indexes
      const [tables] = await sequelize.query(
        `SELECT TABLE_NAME, COUNT(DISTINCT INDEX_NAME) as idx_count
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = '${DB_NAME}'
         GROUP BY TABLE_NAME
         HAVING idx_count > 30`
      );

      for (const row of tables) {
        const tableName = row.TABLE_NAME;
        console.log(`🔧 Cleaning duplicate indexes on '${tableName}'...`);

        const [indexRows] = await sequelize.query(
          `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
           FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = '${DB_NAME}' AND TABLE_NAME = '${tableName}'
           ORDER BY INDEX_NAME, SEQ_IN_INDEX`
        );

        const indexMap = {};
        for (const idx of indexRows) {
          if (!indexMap[idx.INDEX_NAME]) {
            indexMap[idx.INDEX_NAME] = { unique: idx.NON_UNIQUE === 0, columns: [] };
          }
          indexMap[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
        }

        const seen = new Set();
        for (const [name, idx] of Object.entries(indexMap)) {
          if (name === "PRIMARY") continue;
          const sig = [...idx.columns].sort().join(",") + (idx.unique ? "|u" : "|n");
          if (seen.has(sig)) {
            try {
              await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${name}\``);
              console.log(`   ✓ Dropped duplicate index: ${name}`);
            } catch (_) { /* ignore if already gone */ }
          } else {
            seen.add(sig);
          }
        }
      }
    } catch (cleanupErr) {
      console.warn("⚠️  Index cleanup skipped:", cleanupErr.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // SAFE SYNC: alter:false only creates missing tables,
    // never modifies existing tables (prevents index duplication)
    // ─────────────────────────────────────────────────────────────────
    try {
      await sequelize.query(`ALTER TABLE students ADD COLUMN is_full_course BOOLEAN DEFAULT false;`);
      console.log("✅ Added is_full_course column to students table");
    } catch (e) {
      // Ignored if column already exists
    }

    await sequelize.sync({ alter: false });
    console.log("✅ Database synchronized successfully");

    // Seed plans if not exists
    const seedPlans = require("./seeders/seedPlans");
    await seedPlans();

    // Create super admin if not exists
    const createSuperAdmin = require("./seeders/createSuperAdmin");
    await createSuperAdmin();
  } catch (error) {
    console.error("❌ Database error:", error.message);
    console.error("Please ensure MySQL is running and database 'student_saas' exists");
  }
};

// Sync database on startup
syncDatabase();

module.exports = app;
