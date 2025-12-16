// server/src/http/routes.ts
import type { Express } from "express";

export function registerRoutes(app: Express) {
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/version", (_req, res) => {
    res.json({ ok: true, name: "yourvoice" });
  });
}
