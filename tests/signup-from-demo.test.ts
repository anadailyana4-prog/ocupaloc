import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapDemoRowToSignupSeed } from "../src/lib/demo/signup-from-demo";

describe("mapDemoRowToSignupSeed", () => {
  it("maps demo row to signup wizard fields", () => {
    const seed = mapDemoRowToSignupSeed({
      business_name: "Studio Ana",
      business_type: "Manichiură",
      services: [
        { name: "Gel", price: 120, label: "Gel 120 RON" },
        { name: "Întreținere", price: 90, label: "Întreținere 90 RON" }
      ]
    });

    assert.equal(seed.orgName, "Studio Ana");
    assert.equal(seed.activity, "Manichiură/Pedichiură");
    assert.equal(seed.services[0]?.nume, "Gel");
    assert.equal(seed.services[0]?.pret, "120");
    assert.equal(seed.services.length, 3);
  });
});
