/**
 * AI 보조 서비스 — OPENAI_API_KEY 설정 시 LLM, 없으면 규칙 기반 폴백
 */

export type InquiryCategory =
  | "visit_request"
  | "pricing"
  | "finance"
  | "general"
  | "urgent";

const RULE_PATTERNS: Array<{ pattern: RegExp; category: InquiryCategory }> = [
  { pattern: /긴급|빨리|오늘|당장/, category: "urgent" },
  { pattern: /방문|예약|견학|모델하우스/, category: "visit_request" },
  { pattern: /가격|분양가|계약|입주/, category: "pricing" },
  { pattern: /대출|금융|중도금|이자/, category: "finance" },
];

export function classifyInquiryRules(text: string): InquiryCategory {
  for (const { pattern, category } of RULE_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return "general";
}

export async function classifyInquiry(text: string): Promise<{
  category: InquiryCategory;
  source: "llm" | "rules";
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { category: classifyInquiryRules(text), source: "rules" };
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 20,
        messages: [
          {
            role: "system",
            content:
              "Classify real-estate inquiry into one of: visit_request, pricing, finance, general, urgent. Reply with only the category slug.",
          },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = json.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    const valid: InquiryCategory[] = [
      "visit_request",
      "pricing",
      "finance",
      "general",
      "urgent",
    ];
    const category = valid.find((v) => raw.includes(v)) ?? classifyInquiryRules(text);
    return { category, source: "llm" };
  } catch {
    return { category: classifyInquiryRules(text), source: "rules" };
  }
}

export async function summarizeConsultation(note: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || note.length < 20) {
    return note.length > 120 ? `${note.slice(0, 120)}…` : note;
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: "Summarize this real-estate consultation note in Korean, 2-3 sentences.",
          },
          { role: "user", content: note },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error("LLM failed");
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return json.choices[0]?.message?.content?.trim() ?? note.slice(0, 120);
  } catch {
    return note.length > 120 ? `${note.slice(0, 120)}…` : note;
  }
}

export function computeLeadScoreRules(input: {
  hasUnitType: boolean;
  hasVisitDate: boolean;
  hasAppointment: boolean;
  videoPlays: number;
  unitViews: number;
  category?: InquiryCategory;
}): number {
  let score = 10;
  if (input.hasUnitType) score += 20;
  if (input.hasVisitDate) score += 15;
  if (input.hasAppointment) score += 25;
  if (input.videoPlays > 0) score += 15;
  score += Math.min(input.unitViews * 5, 15);
  if (input.category === "urgent") score += 20;
  if (input.category === "visit_request") score += 10;
  return Math.min(score, 100);
}
