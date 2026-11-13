import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "create-admin.js");

test("admin provisioning safely skips unless explicitly enabled", () => {
  const result = spawnSync(process.execPath, [scriptPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      ALLOW_ADMIN_PROVISIONING: "0",
      DATABASE_URL: "",
      ADMIN_NAME: "Should Not Be Created",
      ADMIN_EMAIL: "must-not-create@example.com",
      ADMIN_PASSWORD: "this-password-is-not-used",
    },
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Admin provisioning skipped/);
});
