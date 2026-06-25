import { readFile } from "node:fs/promises"
import path from "node:path"

let cached: string | null = null

/** Read the 2026 resume guidelines (the LLM system-prompt source). */
export async function readGuidelines(): Promise<string> {
  if (cached) return cached
  const file = path.join(
    process.cwd(),
    "refs",
    "resume_guide_lines_2026.md"
  )
  console.log(file)
  cached = await readFile(file, "utf8")
  return cached
}
