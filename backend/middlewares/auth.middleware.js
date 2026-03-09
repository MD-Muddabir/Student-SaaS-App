const jwt = require("jsonwebtoken");
const { User } = require("../models");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // For managers: check live status from DB to enforce blocking in real-time
    if (decoded.role === 'manager') {
      const dbUser = await User.findByPk(decoded.id, {
        attributes: ['id', 'status', 'permissions', 'role']
      });

      if (!dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      if (dbUser.status === 'blocked') {
        return res.status(403).json({
          error: "Account blocked",
          code: "ACCOUNT_BLOCKED",
          message: "Your account has been blocked by the administrator. Please contact them to regain access."
        });
      }

      // Refresh permissions from DB (in case admin updated them after login)
      req.user.permissions = dbUser.permissions;
      req.user.status = dbUser.status;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;
