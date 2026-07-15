const User = require("../models/User");
const ActiveSession = require("../models/ActiveSession");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Save session info
    await ActiveSession.create({
      userId: user.id,
      email: user.email,
      userAgent: req.headers["user-agent"] || "Unknown",
      ipAddress: req.ip || req.connection?.remoteAddress || "127.0.0.1",
    });

    // Write audit log
    await AuditLog.create({
      userId: user.id,
      email: user.email,
      action: "LOGIN",
      details: `Successful console login for ${user.email} (${user.role})`,
    });

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const filter = req.user.role === "Admin" ? {} : { userId: req.user.id };
    const sessions = await ActiveSession.find(filter).sort({ lastSeen: -1 });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const terminateSession = async (req, res) => {
  try {
    const session = await ActiveSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (req.user.role !== "Admin" && String(session.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied. You can only terminate your own sessions." });
    }

    await session.deleteOne();

    // Write audit log
    await AuditLog.create({
      userId: req.user.id,
      email: req.user.email,
      action: "TERMINATE_SESSION",
      details: `Terminated active session ${req.params.id} for user ${session.email}`,
    });

    res.status(200).json({ success: true, message: "Session terminated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { register, login, getSessions, terminateSession };