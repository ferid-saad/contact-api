import express from "express";
import { healthRouter } from "./routes/health.js";
import { contactRouter } from "./routes/contact.js";
import { errorHandler } from "./middlewares/errorHandler.js";

/**
 * Fabrique de l'application. Le repository est injecté : les tests de routes
 * passent un repository en mémoire, server.js passe le repository PostgreSQL.
 */
export function createApp({ contactRepository }) {
  const app = express();

  // TODO (partie 3) : app.disable("x-powered-by") puis app.use(helmet())
  // TODO (partie 3) : limiter la taille du corps JSON à 10 ko
  app.use(express.json());

  app.use("/api/health", healthRouter);
  // TODO (partie 3) : appliquer un rate limiter uniquement sur /api/contact
  app.use("/api/contact", contactRouter({ contactRepository }));

  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });
  // Le middleware d'erreur doit être déclaré EN DERNIER.
  app.use(errorHandler);
  return app;
}
