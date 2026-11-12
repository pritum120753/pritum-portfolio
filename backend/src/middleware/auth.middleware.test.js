import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  requireAdmin,
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

test("requireAdmin rejects non-admin users", () => {
  const req = { user: { role: "USER" } };
  const res = createResponse();

  requireAdmin(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.message, "Admin access required");
});

test("requireAdmin allows admin users", () => {
  const req = { user: { role: "ADMIN" } };
  const res = createResponse();
  let nextCalled = false;

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});
