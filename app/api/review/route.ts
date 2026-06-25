import { NextResponse } from "next/server"

import { buildCapabilitiesPrompt } from "@/lib/resume/editable-paths"
import { normalizeReview } from "@/lib/review/normalize"
import type { ReviewResponse } from "@/lib/review/types"
import { readGuidelines } from "@/lib/server/guidelines"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "openai/gpt-4o-mini"

function buildResponseInstructions(): string {
  return `You are an expert resume reviewer. Evaluate the resume JSON the user provides against the 2026 guidelines above.

${buildCapabilitiesPrompt()}

Respond with ONLY a JSON object (no markdown, no prose) in exactly this shape:
{
  "score": <integer 0-100, overall quality>,
  "categories": {
    "atsCompatibility": <integer 0-100>,
    "achievementImpact": <integer 0-100>,
    "contentClarity": <integer 0-100>,
    "format": <integer 0-100>
  },
  "feedback": [
    {
      "section": "header"|"summary"|"experience"|"education"|"skills"|"general",
      "message": "<one concrete, actionable suggestion>",
      "rationale": "<1-2 sentences: why this change is strong, citing the relevant 2026 guideline>",
      "action": "replace"|"add"|"remove"|"advice",
      "fieldPath": "<an editable path from CAPABILITIES, omit for pure advice>",
      "suggestedValue": "<the exact text to write; omit for advice/remove>"
    }
  ]
}

Provide 4-10 feedback items. Each message must be specific and actionable, and MUST map to an editable fieldPath from CAPABILITIES (use action "advice" with no fieldPath only when no single field applies). Never suggest an edit the app cannot make. Attribute each item to the most relevant section. Every item MUST include a "rationale".

CRITICAL — never invent facts the resume does not contain. Do not fabricate numbers, percentages, dollar amounts, timeframes, dates, employers, titles, or achievements. When a bullet or the summary would be stronger with a metric but the resume contains no real figure, do NOT write a number or a placeholder token. Instead, in "message", describe what to quantify (e.g. "add the percentage this reduced and the resulting business impact") and omit "suggestedValue". Only include "suggestedValue" when you can construct it entirely from facts already present in the resume (e.g. fixing a weak verb, reordering, or formatting).`
}

/** Lets the client know up front whether automated review is available. */
export async function GET(): Promise<NextResponse<{ apiKeyMissing: boolean }>> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  return NextResponse.json({ apiKeyMissing: !apiKey })
}

export async function POST(request: Request): Promise<NextResponse<ReviewResponse>> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  // No-key fallback is a first-class state, not an error.
  if (!apiKey) {
    return NextResponse.json({ ok: true, apiKeyMissing: true })
  }

  let resume: unknown
  try {
    const body = await request.json()
    resume = body?.resume
    if (!resume) throw new Error("missing resume")
  } catch (e) {
    console.error("Review: invalid request body:", e)
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    )
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL

  let guidelines: string
  try {
    guidelines = await readGuidelines()
  } catch (e) {
    console.error("Failed to read guidelines:", e)
    return NextResponse.json(
      { ok: false, error: "Review unavailable. Please try again." },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${guidelines}\n\n---\n\n${buildResponseInstructions()}` },
          { role: "user", content: JSON.stringify(resume) },
        ],
      }),
    })

    if (!res.ok) {
      console.log('Review: failed to get review', res.status, res.statusText);

      return NextResponse.json(
        { ok: false, error: "Review unavailable. Please try again." },
        { status: 502 }
      )
    }

    const data = await res.json()
    const content: unknown = data?.choices?.[0]?.message?.content
    if (typeof content !== "string") {
      return NextResponse.json(
        { ok: false, error: "Review unavailable. Please try again." },
        { status: 502 }
      )
    }

    const review = normalizeReview(parseLooseJson(content))
    if (!review) {
      return NextResponse.json(
        { ok: false, error: "Review unavailable. Please try again." },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true, review })
  } catch (e) {
    console.error("Review: request to OpenRouter failed:", e)
    return NextResponse.json(
      { ok: false, error: "Review unavailable. Please try again." },
      { status: 502 }
    )
  }
}

/** Parse JSON that may be wrapped in markdown fences or surrounding prose. */
function parseLooseJson(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // Fall through to brace extraction.
  }
  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1))
    } catch {
      return null
    }
  }
  return null
}
