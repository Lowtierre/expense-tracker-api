import rateLimit from "express-rate-limit";

// max 5 richieste ogni 15 minuti per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5,
  message: { error: "Troppi tentativi. Riprova tra 15 minuti." },
  standardHeaders: true,
  legacyHeaders: false,
});
