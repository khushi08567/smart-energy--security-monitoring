const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// GET /api/users/me — any logged-in user (MUST be before /:id)
router.get("/me", verifyToken, getMyProfile);

// GET /api/users — Admin and Warden
router.get("/", verifyToken, checkRole("Admin", "Warden"), getAllUsers);

// GET /api/users/:id — Admin and Warden
router.get("/:id", verifyToken, checkRole("Admin", "Warden"), getUserById);

// PUT /api/users/:id — Admin only
router.put("/:id", verifyToken, checkRole("Admin"), updateUser);

// DELETE /api/users/:id — Admin only
router.delete("/:id", verifyToken, checkRole("Admin"), deleteUser);

module.exports = router;