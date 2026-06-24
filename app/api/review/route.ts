import { NextResponse } from "next/server"

import { normalizeReview } from "@/lib/review/normalize"
import type { ReviewResponse } from "@/lib/review/types"
import { readGuidelines } from "@/lib/server/guidelines"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "openai/gpt-4o-mini"

const RESPONSE_INSTRUCTIONS = `You are an expert resume reviewer. Evaluate the resume JSON the user provides against the 2026 guidelines above.

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
    { "section": "header"|"summary"|"experience"|"education"|"skills"|"general", "message": "<one concrete, actionable suggestion>" }
  ]
}

Provide 4-10 feedback items. Each message must be specific and actionable. Attribute each item to the most relevant section.`

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
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    )
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL

  let guidelines: string
  try {
    guidelines = await readGuidelines()
  } catch {
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
          { role: "system", content: `${guidelines}\n\n---\n\n${RESPONSE_INSTRUCTIONS}` },
          { role: "user", content: JSON.stringify(resume) },
        ],
      }),
    })

    if (!res.ok) {
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
  } catch {
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
