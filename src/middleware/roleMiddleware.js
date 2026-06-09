const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login first.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires: ${allowedRoles.join(" or ")} role.`,
      });
    }

    next();
  };
};

module.exports = { checkRole };