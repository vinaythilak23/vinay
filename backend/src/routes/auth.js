import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function safeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    availability: user.availability
  };
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;
    if (!fullName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters." });
    }
    // Public registration intentionally cannot create administrators.
    const safeRole = role === "RESPONDER" ? "RESPONDER" : "CITIZEN";
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { fullName: fullName.trim(), email: normalizedEmail, phone: phone?.trim() || null, passwordHash, role: safeRole }
    });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not log in." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
