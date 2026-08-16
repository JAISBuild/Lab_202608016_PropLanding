import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyInquiryRules,
  computeLeadScoreRules,
} from "../services/ai.js";

test("classifyInquiryRules detects visit request", () => {
  assert.equal(classifyInquiryRules("모델하우스 방문 예약하고 싶습니다"), "visit_request");
});

test("classifyInquiryRules detects pricing", () => {
  assert.equal(classifyInquiryRules("분양가가 얼마인가요"), "pricing");
});

test("computeLeadScoreRules caps at 100", () => {
  const score = computeLeadScoreRules({
    hasUnitType: true,
    hasVisitDate: true,
    hasAppointment: true,
    videoPlays: 3,
    unitViews: 5,
    category: "urgent",
  });
  assert.ok(score <= 100);
  assert.ok(score >= 50);
});
