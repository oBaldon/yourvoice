// server/src/http/routes.ts
import type { Express } from "express";

export function registerRoutes(app: Express) {
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // opcional: útil pra debug/ci
  app.get("/version", (_req, res) => {
    res.json({
      ok: true,
      name: "yourvoice",
      // se quiser depois: commit sha via env
      // commit: process.env.GIT_SHA ?? null
    });
  });
}
