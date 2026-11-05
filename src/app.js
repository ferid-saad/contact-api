import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { contactRouter } from "./routes/contact.js";
import { errorHandler } from "./middlewares/errorHandler.js";

/**
 * Fabrique de l'application. Le repository est injecté : les tests de routes
 * passent un repository en mémoire, server.js passe le repository PostgreSQL.
 */
export function createApp({ contactRepository, rateLimitMax = 5 }) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));  app.use(express.json());


  app.use("/api/health", healthRouter);


  const contactLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS" },
  });
  app.use("/api/contact", contactLimiter, contactRouter({ contactRepository }));
  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });
  // Le middleware d'erreur doit être déclaré EN DERNIER.
  app.use(errorHandler);
  return app;
}
