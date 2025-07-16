import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/api/users/:id", verifyToken, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

router.put("/api/users/:id", async (req, res) => {
  try {
    const updates = {
      username: req.body.username,
      email: req.body.email,
    };

    if (req.body.currentPassword || req.body.newPassword) {
      // Trova utente
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }

      // Verifica password attuale
      const isMatch = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );

      if (!isMatch) {
        return res.status(401).json({ error: "Password attuale non corretta" });
      }

      // Cripta nuova password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);
      updates.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nell'aggiornamento profilo" });
  }
});

export default router;
