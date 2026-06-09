const User = require("../models/User");
const bcrypt = require("bcrypt");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/users/me — any logged-in user sees their own profile
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user, "Profile fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/users — Admin and Warden only
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    return sendSuccess(res, users, "Users fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/users/:id — Admin and Warden only
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user, "User fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// PUT /api/users/:id — Admin only
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, "User not found", 404);

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    const updated = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });

    return sendSuccess(res, updated, "User updated successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// DELETE /api/users/:id — Admin only
const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (parseInt(req.params.id) === req.user.id) {
      return sendError(res, "You cannot delete your own account", 400);
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, "User not found", 404);

    await user.destroy();
    return sendSuccess(res, null, "User deleted successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  getMyProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};