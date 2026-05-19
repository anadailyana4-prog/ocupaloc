import assert from "node:assert/strict";
import test from "node:test";

import { TELEGRAM_TOOL_COMMANDS } from "../src/lib/outreach/ops-constants";
import { buildHelpMessage } from "../src/lib/outreach/telegram-bot";

test("telegram help message lists email and whatsapp commands", () => {
  const help = buildHelpMessage();

  for (const item of TELEGRAM_TOOL_COMMANDS) {
    if (item.command === "help") continue;
    assert.match(help, new RegExp(`/${item.command}`));
  }

  assert.match(help, /email/i);
  assert.match(help, /whatsapp/i);
  assert.match(help, /07xx.*\|.*frizerie/i);
});
