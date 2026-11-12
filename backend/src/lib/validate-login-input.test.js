import test from "node:test";
import assert from "node:assert/strict";
import { validateLoginInput } from "./validate-login-input.js";

test("normalizes a valid email and preserves password", () => {
  assert.deepEqual(
    validateLoginInput({ email: "  ADMIN@EXAMPLE.COM ", password: "secret" }),
    { valid: true, email: "admin@example.com", password: "secret" },
  );
});

test("rejects missing and non-string credentials", () => {
  assert.equal(validateLoginInput({}).valid, false);
  assert.equal(validateLoginInput({ email: 123, password: true }).valid, false);
});

test("rejects malformed email addresses", () => {
  assert.equal(
    validateLoginInput({ email: "not-an-email", password: "secret" }).valid,
    false,
  );
});

test("rejects excessively long passwords", () => {
  assert.equal(
    validateLoginInput({ email: "admin@example.com", password: "x".repeat(129) }).valid,
    false,
  );
});
