import test from "node:test";
import assert from "node:assert/strict";
import { createLoginRateLimiter } from "./login-rate-limit.middleware.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test("allows requests within the configured login limit", () => {
  const limiter = createLoginRateLimiter({ maxAttempts: 2, windowMs: 1000, now: () => 100 });
  const req = { ip: "127.0.0.1" };
  let nextCount = 0;

  limiter(req, createResponse(), () => { nextCount += 1; });
  limiter(req, createResponse(), () => { nextCount += 1; });

  assert.equal(nextCount, 2);
});

test("blocks requests after the configured login limit", () => {
  const limiter = createLoginRateLimiter({ maxAttempts: 1, windowMs: 60_000, now: () => 100 });
  const req = { ip: "127.0.0.1" };
  limiter(req, createResponse(), () => {});
  const res = createResponse();

  limiter(req, res, () => assert.fail("next must not be called"));

  assert.equal(res.statusCode, 429);
  assert.equal(res.headers["Retry-After"], "60");
});

test("tracks client addresses independently", () => {
  const limiter = createLoginRateLimiter({ maxAttempts: 1, windowMs: 1000, now: () => 100 });
  let nextCount = 0;

  limiter({ ip: "client-a" }, createResponse(), () => { nextCount += 1; });
  limiter({ ip: "client-b" }, createResponse(), () => { nextCount += 1; });

  assert.equal(nextCount, 2);
});
