import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createMemoryContactRepository } from "../src/repositories/contactRepository.js";

const valid = { name: "Ada Lovelace", email: "ada@example.com", message: "Bonjour, ceci est un test." };

describe("POST /api/contact", () => {
  let repo;
  let app;
  beforeEach(() => {
    repo = createMemoryContactRepository();
    app = createApp({ contactRepository: repo });
  });

  it("accepte un message valide (201)", async () => {
    const res = await request(app).post("/api/contact").send(valid);
    expect(res.status).toBe(201);
    expect(repo.items).toHaveLength(1);
  });

  it("refuse un email invalide (400 VALIDATION_ERROR)", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, email: "pas-un-email" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(res.body.details.map((d) => d.field)).toContain("email");
    expect(repo.items).toHaveLength(0);
  });

  it("refuse un champ manquant", async () => {
    const { email, ...sansEmail } = valid;
    const res = await request(app).post("/api/contact").send(sansEmail);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(res.body.details.map((d) => d.field)).toContain("email");
  });

  it("refuse un champ supplémentaire (ex. isAdmin: true)", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    expect(repo.items).toHaveLength(0);
  });

  it("refuse un type inattendu (message: 42, name: ['a'])", async () => {
    const res = await request(app).post("/api/contact").send({ ...valid, message: 42, name: ["a"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_ERROR");
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toContain("message");
    expect(fields).toContain("name");
  });

  it("refuse un JSON mal formé (400 INVALID_JSON)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .set("Content-Type", "application/json")
      .send('{"name": "Ada",');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "INVALID_JSON" });
  });

  it("refuse un corps de plus de 10 ko (413)", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...valid, message: "a".repeat(11000) });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: "PAYLOAD_TOO_LARGE" });
  });

  it("stocke tel quel un nom contenant une tentative d'injection SQL", async () => {
    const name = "Robert'); DROP TABLE contacts;--";
    const res = await request(app).post("/api/contact").send({ ...valid, name });
    expect(res.status).toBe(201);
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].name).toBe(name);
  });

  it("ne renvoie jamais de stack trace en cas d'erreur 500", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingRepo = {
      create: async () => {
        throw new Error("secret: connexion a la base refusee");
      },
    };
    const failingApp = createApp({ contactRepository: failingRepo });

    const res = await request(failingApp).post("/api/contact").send(valid);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "INTERNAL_ERROR" });
    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("secret");
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("ajoute les headers de sécurité Helmet (x-content-type-options, ...)", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });

  it("ne renvoie pas le header x-powered-by", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("répond 429 après trop de requêtes sur /api/contact", async () => {
    const limitedApp = createApp({ contactRepository: repo, rateLimitMax: 3 });
    const codes = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(limitedApp).post("/api/contact").send(valid);
      codes.push(res.status);
    }
    expect(codes).toEqual([201, 201, 201, 429]);
  });
});
