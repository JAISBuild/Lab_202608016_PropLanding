import assert from "node:assert/strict";
import { test } from "node:test";
import { createHealthResponse } from "@proplanding/shared";

test("health response shape", () => {
  const res = createHealthResponse("@proplanding/api", "0.1.0");
  assert.equal(res.status, "ok");
  assert.equal(res.service, "@proplanding/api");
});
