import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  createRequireAdmin,
  createRequireSuperAdmin,
} from "./auth.middleware.js";

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("authenticateToken rejects requests without a bearer token", () => {
  const req = { headers: {} };
  const res = createResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.message, "Authentication token required");
  assert.equal(nextCalled, false);
});

test("authenticateToken rejects invalid tokens", () => {
  const req = { headers: { authorization: "Bearer invalid-token" } };
  const res = createResponse();

  authenticateToken(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.message, "Invalid or expired token");
});

test("authenticateToken attaches verified claims", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-that-is-long-enough";
  try {
    const token = jwt.sign({ userId: "admin-1", role: "ADMIN" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createResponse();
    let nextCalled = false;

    authenticateToken(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.userId, "admin-1");
    assert.equal(req.user.role, "ADMIN");
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test("requireAdmin rejects non-admin token claims without a database lookup", async () => {
  const requireAdmin = createRequireAdmin(() => assert.fail("lookup must not run"));
  const req = { user: { userId: "user-1", role: "USER" } };
  const res = createResponse();

  await requireAdmin(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, "Admin access required");
});

test("requireAdmin rejects deleted or demoted accounts", async () => {
  const requireAdmin = createRequireAdmin(async () => null);
  const req = { user: { userId: "deleted-admin", role: "ADMIN" } };
  const res = createResponse();

  await requireAdmin(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, "Admin access required");
});

test("requireAdmin allows an existing regular admin account", async () => {
  const requireAdmin = createRequireAdmin(async (id) => ({ id, role: "ADMIN" }));
  const req = { user: { userId: "admin-1", role: "ADMIN" } };
  const res = createResponse();
  let nextCalled = false;

  await requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.admin, { id: "admin-1", role: "ADMIN" });
});

test("requireAdmin allows an existing super admin account", async () => {
  const requireAdmin = createRequireAdmin(async (id) => ({ id, role: "SUPER_ADMIN" }));
  const req = { user: { userId: "super-1", role: "SUPER_ADMIN" } };
  const res = createResponse();
  let nextCalled = false;

  await requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.admin, { id: "super-1", role: "SUPER_ADMIN" });
});

test("requireAdmin rejects stale role claims after a role change", async () => {
  const requireAdmin = createRequireAdmin(async (id) => ({ id, role: "ADMIN" }));
  const req = { user: { userId: "promoted-admin", role: "SUPER_ADMIN" } };
  const res = createResponse();

  await requireAdmin(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 403);
});

test("requireSuperAdmin rejects regular admins", async () => {
  const requireSuperAdmin = createRequireSuperAdmin(() => assert.fail("lookup must not run"));
  const req = { user: { userId: "admin-1", role: "ADMIN" } };
  const res = createResponse();

  await requireSuperAdmin(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, "Super admin access required");
});

test("requireSuperAdmin rejects deleted or demoted super admins", async () => {
  const requireSuperAdmin = createRequireSuperAdmin(async () => null);
  const req = { user: { userId: "deleted-super", role: "SUPER_ADMIN" } };
  const res = createResponse();

  await requireSuperAdmin(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, "Super admin access required");
});

test("requireSuperAdmin allows the active super admin", async () => {
  const requireSuperAdmin = createRequireSuperAdmin(async (id) => ({ id, role: "SUPER_ADMIN" }));
  const req = { user: { userId: "super-1", role: "SUPER_ADMIN" } };
  const res = createResponse();
  let nextCalled = false;

  await requireSuperAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.admin, { id: "super-1", role: "SUPER_ADMIN" });
});

test("requireAdmin forwards database errors to the error handler", async () => {
  const databaseError = new Error("database unavailable");
  const requireAdmin = createRequireAdmin(async () => { throw databaseError; });
  const req = { user: { userId: "admin-1", role: "ADMIN" } };
  const res = createResponse();
  let forwardedError = null;

  await requireAdmin(req, res, (error) => { forwardedError = error; });

  assert.equal(forwardedError, databaseError);
});
