"use client";

import { Suspense } from "react";
import InquiriesContent from "./InquiriesContent";

export default function InquiriesPage() {
  return (
    <Suspense fallback={<div>로딩…</div>}>
      <InquiriesContent />
    </Suspense>
  );
}
