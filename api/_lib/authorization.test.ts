/**
 * Authorization regression tests.
 *
 * Each case here corresponds to a request that once succeeded without any
 * credentials. They exist to stop that from happening again as routes are
 * added, and to pin down which paths are deliberately anonymous.
 */
import { describe, it, expect, beforeAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { app as baseApp, registerRoutes, errorHandler } from "./index.js";

let app: Express;
let alice: { token: string; projectId: string; metricId: string };
let mallory: { token: string };

async function registerUser(username: string): Promise<string> {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "Passw0rd!" })
    .expect(201);
  return response.body.token;
}

beforeAll(async () => {
  app = baseApp;
  app.use(express.json());
  await registerRoutes(app);
  app.use(errorHandler);

  const aliceToken = await registerUser(`alice-${Date.now()}`);
  const project = await request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${aliceToken}`)
    .send({
      title: "Original title",
      description: "Owned by alice",
      type: "Packaging",
      estimatedCost: "1000.00",
      roi: "10.00",
    })
    .expect(201);

  const metric = await request(app)
    .post(`/api/projects/${project.body.id}/metrics`)
    .set("Authorization", `Bearer ${aliceToken}`)
    .send({ metricName: "Recycled content", value: "80", unit: "%" })
    .expect(201);

  alice = { token: aliceToken, projectId: project.body.id, metricId: metric.body.id };
  mallory = { token: await registerUser(`mallory-${Date.now()}`) };
});

describe("anonymous requests", () => {
  it("cannot update someone else's project", async () => {
    await request(app)
      .patch(`/api/projects/${alice.projectId}`)
      .send({ title: "HIJACKED" })
      .expect(401);

    const project = await request(app)
      .get(`/api/projects/${alice.projectId}`)
      .expect(200);
    expect(project.body.title).toBe("Original title");
  });

  it("cannot read, modify or delete project metrics", async () => {
    await request(app).get(`/api/projects/${alice.projectId}/metrics`).expect(401);
    await request(app)
      .patch(`/api/project-metrics/${alice.metricId}`)
      .send({ value: "999" })
      .expect(401);
    await request(app).delete(`/api/project-metrics/${alice.metricId}`).expect(401);
  });

  it("cannot read business analytics for a project", async () => {
    await request(app).get(`/api/projects/${alice.projectId}/qr-scans`).expect(401);
    await request(app).get(`/api/projects/${alice.projectId}/survey-responses`).expect(401);
    await request(app).get(`/api/projects/${alice.projectId}/feedback-score`).expect(401);
  });

  it("cannot spend AI or parsing budget", async () => {
    await request(app).post("/api/classify-project").send({ description: "x" }).expect(401);
    await request(app).post("/api/parse-excel").send({ fileData: "" }).expect(401);
  });
});

describe("authenticated non-owners", () => {
  it("are refused, not merely unauthenticated", async () => {
    await request(app)
      .patch(`/api/projects/${alice.projectId}`)
      .set("Authorization", `Bearer ${mallory.token}`)
      .send({ title: "HIJACKED" })
      .expect(403);

    await request(app)
      .delete(`/api/projects/${alice.projectId}`)
      .set("Authorization", `Bearer ${mallory.token}`)
      .expect(403);
  });

  it("do not see other users' projects in their list", async () => {
    const list = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${mallory.token}`)
      .expect(200);
    expect(list.body).toEqual([]);
  });
});

describe("owners", () => {
  it("can update their own project", async () => {
    const updated = await request(app)
      .patch(`/api/projects/${alice.projectId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ title: "Renamed by owner" })
      .expect(200);
    expect(updated.body.title).toBe("Renamed by owner");
  });

  it("cannot reassign ownership through the update body", async () => {
    await request(app)
      .patch(`/api/projects/${alice.projectId}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ userId: "attacker-id" })
      .expect(200);

    const project = await request(app)
      .get(`/api/projects/${alice.projectId}`)
      .expect(200);
    expect(project.body.userId).not.toBe("attacker-id");
  });
});

describe("the consumer survey path stays anonymous", () => {
  it("serves questions, records scans and accepts responses without a token", async () => {
    const question = await request(app)
      .post("/api/survey-questions")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({
        projectId: alice.projectId,
        questionText: "How much does this influence your purchase?",
        questionType: "scale",
        orderIndex: 0,
      })
      .expect(201);

    await request(app).get(`/api/projects/${alice.projectId}/survey-questions`).expect(200);
    await request(app).post(`/api/projects/${alice.projectId}/qr-scan`).expect(201);
    await request(app)
      .post("/api/survey-responses")
      .send({
        projectId: alice.projectId,
        questionId: question.body.id,
        answer: "4",
        numericValue: "4",
      })
      .expect(201);
  });
});
