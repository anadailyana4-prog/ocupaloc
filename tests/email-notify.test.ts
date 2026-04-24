/**
 * Unit tests for email notification helpers in programare-notify.ts.
 *
 * The Resend HTTP call (fetch) is intercepted by replacing global.fetch
 * with a stub inside each test. This avoids any real network traffic and
 * validates that the correct payload is sent.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

import { notifyProfesionistNewProgramare } from "../src/lib/email/programare-notify";

type FetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: {
    from: string;
    to: string[];
    subject: string;
    text: string;
  };
};

function makeOkResponse(): Response {
  return new Response(JSON.stringify({ id: "email-id-1" }), { status: 200 });
}

function makeBadResponse(status: number, body = ""): Response {
  return new Response(body, { status });
}

function captureAndStub(response: Response): { calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
    const body = JSON.parse((init?.body as string) ?? "{}") as FetchCall["body"];
    calls.push({
      url,
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
      body
    });
    return response;
  });
  return { calls };
}

test.beforeEach(() => {
  process.env.RESEND_API_KEY = "test-api-key";
  process.env.RESEND_FROM = "noreply@ocupaloc.ro";
});

test.afterEach(() => {
  mock.restoreAll();
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
});

// ─── Tests ──────────────────────────────────────────────────────────────────

test("notifyProfesionistNewProgramare: sends email with correct recipient and subject", async () => {
  const { calls } = captureAndStub(makeOkResponse());

  await notifyProfesionistNewProgramare({
    to: "salon@example.com",
    clientName: "Maria Ionescu",
    clientPhone: "0712345678",
    serviceName: "Tuns",
    appointmentStart: new Date("2026-11-02T07:00:00.000Z") // 09:00 Bucharest EET
  });

  assert.equal(calls.length, 1, "fetch should be called once");
  const call = calls[0]!;
  assert.equal(call.url, "https://api.resend.com/emails");
  assert.equal(call.method, "POST");
  assert.deepEqual(call.body.to, ["salon@example.com"]);
  assert.ok(call.body.subject.includes("Maria Ionescu"), "subject should include client name");
  assert.ok(call.body.text.includes("Maria Ionescu"), "text should include client name");
  assert.ok(call.body.text.includes("0712345678"), "text should include client phone");
  assert.ok(call.body.text.includes("Tuns"), "text should include service name");
});

test("notifyProfesionistNewProgramare: does not send when to is null", async () => {
  const { calls } = captureAndStub(makeOkResponse());

  await notifyProfesionistNewProgramare({
    to: null,
    clientName: "Maria Ionescu",
    clientPhone: "0712345678",
    serviceName: "Tuns",
    appointmentStart: new Date()
  });

  assert.equal(calls.length, 0, "fetch should NOT be called when recipient is null");
});

test("notifyProfesionistNewProgramare: does not send when to is empty string", async () => {
  const { calls } = captureAndStub(makeOkResponse());

  await notifyProfesionistNewProgramare({
    to: "   ",
    clientName: "Client",
    clientPhone: "0712345678",
    serviceName: "Serviciu",
    appointmentStart: new Date()
  });

  assert.equal(calls.length, 0, "fetch should NOT be called when recipient is whitespace");
});

test("notifyProfesionistNewProgramare: throws when RESEND_API_KEY is missing", async () => {
  delete process.env.RESEND_API_KEY;
  captureAndStub(makeOkResponse());

  await assert.rejects(
    () =>
      notifyProfesionistNewProgramare({
        to: "salon@example.com",
        clientName: "Client",
        clientPhone: "0712345678",
        serviceName: "Serviciu",
        appointmentStart: new Date()
      }),
    /RESEND_API_KEY/
  );
});

test("notifyProfesionistNewProgramare: throws when RESEND_FROM is missing", async () => {
  delete process.env.RESEND_FROM;
  captureAndStub(makeOkResponse());

  await assert.rejects(
    () =>
      notifyProfesionistNewProgramare({
        to: "salon@example.com",
        clientName: "Client",
        clientPhone: "0712345678",
        serviceName: "Serviciu",
        appointmentStart: new Date()
      }),
    /RESEND_FROM/
  );
});

test("notifyProfesionistNewProgramare: throws on Resend HTTP error response", async () => {
  captureAndStub(makeBadResponse(422, "validation error"));

  await assert.rejects(
    () =>
      notifyProfesionistNewProgramare({
        to: "salon@example.com",
        clientName: "Client",
        clientPhone: "0712345678",
        serviceName: "Serviciu",
        appointmentStart: new Date()
      }),
    /Resend 422/
  );
});

test("notifyProfesionistNewProgramare: Authorization header uses Bearer token", async () => {
  const { calls } = captureAndStub(makeOkResponse());

  await notifyProfesionistNewProgramare({
    to: "salon@example.com",
    clientName: "Client",
    clientPhone: "0712345678",
    serviceName: "Serviciu",
    appointmentStart: new Date()
  });

  const auth = calls[0]!.headers["Authorization"];
  assert.equal(auth, "Bearer test-api-key");
});

test("notifyProfesionistNewProgramare: appointment date appears in text body", async () => {
  const { calls } = captureAndStub(makeOkResponse());
  // 2026-11-02T07:00:00Z = 09:00 EET → should format as "02.11.2026" and "09:00"
  await notifyProfesionistNewProgramare({
    to: "salon@example.com",
    clientName: "Ana Test",
    clientPhone: "0712345678",
    serviceName: "Manichiura",
    appointmentStart: new Date("2026-11-02T07:00:00.000Z")
  });

  const text = calls[0]!.body.text;
  assert.ok(text.includes("02.11.2026"), `text should include date, got: ${text}`);
  assert.ok(text.includes("09:00"), `text should include time, got: ${text}`);
});
