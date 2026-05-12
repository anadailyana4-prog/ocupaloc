import assert from "node:assert/strict";
import test from "node:test";

import { OUTREACH_COMMANDS } from "../src/lib/outreach/ops-constants";
import { buildHelpMessage } from "../src/lib/outreach/telegram-bot";

test("telegram help message contains all required commands in romanian", () => {
  const help = buildHelpMessage();

  for (const item of OUTREACH_COMMANDS) {
    assert.match(help, new RegExp(`/${item.command}`));
  }

  assert.match(help, /Comenzi disponibile/i);
  assert.match(help, /opreste temporar trimiterea/i);
  assert.match(help, /Confirma trecerea/i);
});