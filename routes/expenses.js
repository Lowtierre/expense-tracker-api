import express from "express";
import Expense from "../models/Expense.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Create Expense
router.post("/api/expenses", verifyToken, async (req, res) => {
  try {
    if (!req.body.id) {
      req.body.id = uuidv4();
    }

    req.body.userId = req.user.id;

    const expense = await Expense.create(req.body);
    res.json({ message: "Movimento salvato", data: expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Read all Expenses
router.get("/api/expenses", verifyToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({
      date: -1,
    });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero dati" });
  }
});

// Update Expense
router.put("/api/expenses/:id", async (req, res) => {
  try {
    const updated = await Expense.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Elemento non trovato" });
    }

    res.json({ message: "Aggiornato con successo", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nell'aggiornamento" });
  }
});

// Delete Expense
router.delete("/api/expenses/:id", async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ id: req.params.id });

    if (!deleted) {
      return res.status(404).json({ error: "Elemento non trovato" });
    }

    res.json({ message: "Eliminato con successo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
});

export default router;
