import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

export default router;
