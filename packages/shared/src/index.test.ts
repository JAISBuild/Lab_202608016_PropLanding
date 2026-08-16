import assert from "node:assert/strict";
import { test } from "node:test";
import { API_VERSION, createHealthResponse } from "./index.js";

test("API_VERSION is v1", () => {
  assert.equal(API_VERSION, "v1");
});

test("createHealthResponse returns ok status", () => {
  const res = createHealthResponse("test", "0.1.0");
  assert.equal(res.status, "ok");
  assert.equal(res.service, "test");
  assert.equal(res.version, "0.1.0");
  assert.ok(res.timestamp);
});
