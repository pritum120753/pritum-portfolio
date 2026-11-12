import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAdminCreateInput,
  validateAdminUpdateInput,
  getAdminDeletionError,
} from "./validate-admin-input.js";

test("validates and normalizes a new admin account", () => {
  assert.deepEqual(
    validateAdminCreateInput({
      name: "  Second Admin ",
      email: " ADMIN2@EXAMPLE.COM ",
      password: "a-secure-password-123",
    }),
    {
      valid: true,
      data: {
        name: "Second Admin",
        email: "admin2@example.com",
        password: "a-secure-password-123",
      },
    },
  );
});

test("rejects missing or malformed admin creation fields", () => {
  assert.equal(validateAdminCreateInput({}).valid, false);
  assert.equal(
    validateAdminCreateInput({
      name: "Admin",
      email: "not-an-email",
      password: "a-secure-password-123",
    }).valid,
    false,
  );
  assert.equal(
    validateAdminCreateInput({
      name: "Admin",
      email: "admin@example.com",
      password: "short",
    }).valid,
    false,
  );
});

test("allows name and email changes without changing password", () => {
  assert.deepEqual(
    validateAdminUpdateInput({ name: "Updated Name", email: "NEW@EXAMPLE.COM" }),
    { valid: true, data: { name: "Updated Name", email: "new@example.com" } },
  );
});

test("allows password to remain unchanged when the password field is blank", () => {
  assert.deepEqual(
    validateAdminUpdateInput({ password: "" }),
    { valid: false, message: "Provide at least one valid field to update" },
  );
});

test("validates an optional replacement password", () => {
  assert.equal(validateAdminUpdateInput({ password: "too-short" }).valid, false);
  assert.deepEqual(
    validateAdminUpdateInput({ password: "a-new-secure-password" }),
    { valid: true, data: { password: "a-new-secure-password" } },
  );
});

test("blocks self-deletion and deletion of the last admin", () => {
  assert.equal(
    getAdminDeletionError({ actorId: "admin-1", targetId: "admin-1", adminCount: 3 }),
    "You cannot delete your own admin account",
  );
  assert.equal(
    getAdminDeletionError({ actorId: "admin-1", targetId: "admin-2", adminCount: 1 }),
    "At least one admin account must remain",
  );
  assert.equal(
    getAdminDeletionError({ actorId: "admin-1", targetId: "admin-2", adminCount: 2 }),
    null,
  );
});
