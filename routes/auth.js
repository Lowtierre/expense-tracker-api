import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verifica se esiste già l'utente
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Utente già registrato." });
    }

    // Cifra la password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "Registrazione avvenuta con successo",
      userId: savedUser._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore durante la registrazione" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // cerca l'utente per email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // confronta la password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Password errata" });
    }

    // genera JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login effettuato",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore durante il login" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Email non trovata" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Configura nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Recupero password Expense Tracker",
      html: `
        <p>Ciao ${user.username},</p>
        <p>Per reimpostare la tua password, clicca sul link qui sotto:</p>
        <a href="${resetLink}">Reimposta Password</a>
        <p>Questo link scade tra 15 minuti.</p>
      `,
    });

    res.json({ message: "Email di recupero inviata" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore durante il recupero password" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password aggiornata con successo" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Token non valido o scaduto" });
  }
});

export default router;
