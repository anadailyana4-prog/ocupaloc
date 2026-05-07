import assert from "node:assert/strict";
import test from "node:test";

import { runSendEmailsJob } from "../src/lib/jobs/send-emails";

type QueueRow = {
  id: string;
  template: string;
  to_email: string;
  subject: string;
  payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  last_error?: string;
};

function makeAdmin(rows: QueueRow[]) {
  const rowMap = new Map(rows.map((row) => [row.id, { ...row }]));

  return {
    rpc: async (name: string) => {
      if (name !== "claim_email_queue_items") {
        return { data: null, error: { message: "unexpected rpc" } };
      }
      return {
        data: rows.map((row) => ({
          ...row,
          next_retry_at: new Date().toISOString(),
          last_error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sent_at: null
        })),
        error: null
      };
    },
    from: (table: string) => {
      assert.equal(table, "email_queue");
      return {
        update: (payload: Record<string, unknown>) => ({
          eq: async (_column: string, id: string) => {
            const row = rowMap.get(id);
            if (!row) {
              return { error: { message: "missing row" } };
            }
            Object.assign(row, payload);
            return { error: null };
          }
        })
      };
    },
    getRow: (id: string) => rowMap.get(id)
  };
}

test("send emails job marks queued email as sent", async () => {
  const admin = makeAdmin([
    {
      id: "q1",
      template: "booking_client_confirmation",
      to_email: "client@example.com",
      subject: "Test",
      payload: { text: "hello" },
      status: "queued",
      retry_count: 0
    }
  ]);

  const sentTo: string[] = [];
  const result = await runSendEmailsJob(10, {
    admin: admin as never,
    emailSender: async ({ to }) => {
      sentTo.push(to[0] ?? "");
    }
  });

  assert.equal(result.claimed, 1);
  assert.equal(result.sent, 1);
  assert.equal(result.retried, 0);
  assert.equal(result.failedFinal, 0);
  assert.deepEqual(sentTo, ["client@example.com"]);
  assert.equal(admin.getRow("q1")?.status, "sent");
});

test("send emails job requeues failed send with retry", async () => {
  const admin = makeAdmin([
    {
      id: "q2",
      template: "booking_client_confirmation",
      to_email: "retry@example.com",
      subject: "Test Retry",
      payload: { text: "hello" },
      status: "queued",
      retry_count: 0
    }
  ]);

  const result = await runSendEmailsJob(10, {
    admin: admin as never,
    emailSender: async () => {
      throw new Error("resend down");
    }
  });

  assert.equal(result.claimed, 1);
  assert.equal(result.sent, 0);
  assert.equal(result.retried, 1);
  assert.equal(result.failedFinal, 0);

  const row = admin.getRow("q2");
  assert.equal(row?.status, "queued");
  assert.equal(row?.retry_count, 1);
  assert.match(String(row?.last_error), /resend down/i);
});
