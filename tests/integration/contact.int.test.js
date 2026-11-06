import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import pg from "pg";
import { createApp } from "../../src/app.js";
import { createPgContactRepository } from "../../src/repositories/contactRepository.js";

// Prérequis : docker compose up -d --wait && npm run migrate (variables PG* exportées).
describe("Intégration API ↔ PostgreSQL", () => {
  let pool;
  let app;
  const testEmail = "integration-test@example.com";

  beforeAll(() => {
    pool = new pg.Pool();
    app = createApp({ contactRepository: createPgContactRepository(pool) });
  });

  afterAll(async () => {
    // Nettoyage : on supprime uniquement les lignes créées par ces tests
    await pool.query("DELETE FROM contacts WHERE email = $1", [testEmail]);
    await pool.end();
  });

  it("enregistre un contact dans PostgreSQL", async () => {
    const res = await request(app).post("/api/contact").send({
      name: "Ada Lovelace",
      email: testEmail,
      message: "Message de test d'intégration.",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("received");

    const { rows } = await pool.query("SELECT * FROM contacts WHERE id = $1", [res.body.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Ada Lovelace");
    expect(rows[0].email).toBe(testEmail);
  });

  it("résiste à une tentative d'injection SQL", async () => {
    const injection = "Robert'); DROP TABLE contacts;--";

    const res = await request(app).post("/api/contact").send({
      name: injection,
      email: testEmail,
      message: "Tentative d'injection SQL dans le nom.",
    });

    expect(res.status).toBe(201);

    // La table contacts existe toujours
    const table = await pool.query("SELECT to_regclass('public.contacts') AS t");
    expect(table.rows[0].t).not.toBeNull();

    // La valeur est stockée telle quelle, sans être interprétée comme du SQL
    const { rows } = await pool.query("SELECT name FROM contacts WHERE id = $1", [res.body.id]);
    expect(rows[0].name).toBe(injection);
  });
});
