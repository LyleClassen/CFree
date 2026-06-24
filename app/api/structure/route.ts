import { NextResponse } from "next/server"

import { heuristicParse } from "@/lib/import/heuristic"
import { emptyResume } from "@/lib/resume/factory"
import { normalizeResume } from "@/lib/resume/storage"
import type { Resume } from "@/lib/resume/types"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "openai/gpt-4o-mini"

const STRUCTURE_PROMPT = `You convert raw resume text (which may contain OCR noise, broken line breaks, or mangled characters) into a structured JSON resume.

Clean up obvious OCR artifacts (e.g. " egmail.com" -> "@gmail.com") but never invent facts. Leave a field empty if the information is not present.

The text may have been produced by a layout-aware extractor and can contain markers:
- "[COLUMN sidebar]" / "[COLUMN main]" mark which column content came from. A sidebar usually holds contact details, links, a SKILLS list, languages, and hobbies; the main column usually holds the profile/summary and employment history. Use these as strong section boundaries.
- "## HEADING" lines are section headings (e.g. "## SKILLS", "## EMPLOYMENT HISTORY", "## EDUCATION").

Section mapping rules — follow strictly:
- Populate "skills" ONLY from the dedicated skills section (e.g. under "## SKILLS"). Each listed item is one skill.
- Tool/technology lists that appear INSIDE an employment entry — introduced by phrases like "Technologies worked with:", "Primary Technologies Worked With:", "Tech stack:", or listed under a job — belong in that experience entry's "bullets". NEVER copy them into the top-level "skills" array.
- "Client Projects:" / "Worked for clients:" lists under a job are also that entry's "bullets".
- Map employment/experience headings to "experience", education to "education", and contact details to "header". Ignore sections with no matching field (languages, hobbies, references, courses, date of birth, nationality, driving licence) — do not invent fields for them.
- For each experience entry, split "Role at Company, Location" into role, company, and location; put the date range into startDate/endDate.

Respond with ONLY a JSON object (no markdown, no prose) in exactly this shape:
{
  "header": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "summary": "",
  "experience": [ { "company": "", "role": "", "startDate": "", "endDate": "", "location": "", "bullets": [""] } ],
  "education": [ { "institution": "", "degree": "", "field": "", "graduationDate": "", "gpa": "" } ],
  "skills": [""]
}

Use the literal value "Present" for an ongoing role's endDate.`

export interface StructureResponse {
  ok: boolean
  resume?: Resume
  error?: string
}

export async function POST(
  request: Request
): Promise<NextResponse<StructureResponse>> {
  let text = ""
  try {
    const body = await request.json()
    text = typeof body?.text === "string" ? body.text : ""
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    )
  }

  if (!text.trim()) {
    return NextResponse.json({ ok: true, resume: emptyResume() })
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim()

  // Heuristic fallback when no LLM is configured.
  if (!apiKey) {
    return NextResponse.json({ ok: true, resume: heuristicParse(text) })
  }

  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: STRUCTURE_PROMPT },
          { role: "user", content: text },
        ],
      }),
    })

    if (!res.ok) throw new Error("openrouter error")
    const data = await res.json()
    const content: unknown = data?.choices?.[0]?.message?.content
    if (typeof content !== "string") throw new Error("no content")

    const parsed = parseLooseJson(content)
    if (!parsed) throw new Error("unparseable")
    return NextResponse.json({ ok: true, resume: normalizeResume(parsed) })
  } catch {
    // Degrade to heuristic parsing rather than failing the import.
    return NextResponse.json({ ok: true, resume: heuristicParse(text) })
  }
}

function parseLooseJson(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    // fall through
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
