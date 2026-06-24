"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

import { InlineSuggestions } from "@/components/resume/editor/inline-suggestions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { emptyEducation, emptyExperience } from "@/lib/resume/factory"
import { useResumeStore } from "@/lib/resume/store"
import { PRESENT } from "@/lib/resume/types"

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  const id = React.useId()
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function EntryControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move up"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <HugeiconsIcon icon={ArrowUp01Icon} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <HugeiconsIcon icon={ArrowDown01Icon} />
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        aria-label="Remove"
        onClick={() => onRemove(index)}
      >
        <HugeiconsIcon icon={Delete02Icon} />
      </Button>
    </div>
  )
}

function move<T>(arr: T[], from: number, to: number): void {
  if (to < 0 || to >= arr.length) return
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
}

export function HeaderForm() {
  const { resume, updateResume } = useResumeStore()
  const h = resume.header
  return (
    <div className="space-y-3">
      <Field
        label="Full name"
        value={h.fullName}
        placeholder="Jane Doe"
        onChange={(v) => updateResume((d) => void (d.header.fullName = v))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Email"
          type="email"
          value={h.email}
          placeholder="jane@example.com"
          onChange={(v) => updateResume((d) => void (d.header.email = v))}
        />
        <Field
          label="Phone"
          value={h.phone}
          placeholder="(555) 123-4567"
          onChange={(v) => updateResume((d) => void (d.header.phone = v))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Location"
          value={h.location}
          placeholder="San Francisco, CA"
          onChange={(v) => updateResume((d) => void (d.header.location = v))}
        />
        <Field
          label="LinkedIn"
          value={h.linkedin ?? ""}
          placeholder="linkedin.com/in/jane"
          onChange={(v) => updateResume((d) => void (d.header.linkedin = v))}
        />
      </div>
      <InlineSuggestions section="header" />
    </div>
  )
}

export function SummaryForm() {
  const { resume, updateResume } = useResumeStore()
  return (
    <div className="space-y-2">
      <Label htmlFor="summary">Professional summary</Label>
      <Textarea
        id="summary"
        rows={4}
        value={resume.summary}
        placeholder="A short, impact-focused summary of your experience…"
        onChange={(e) =>
          updateResume((d) => void (d.summary = e.target.value))
        }
      />
      <InlineSuggestions section="summary" />
    </div>
  )
}

export function ExperienceForm() {
  const { resume, updateResume } = useResumeStore()
  const items = resume.experience

  return (
    <div className="space-y-3">
      {items.map((exp, idx) => (
        <div key={exp.id} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Experience {idx + 1}
            </span>
            <EntryControls
              index={idx}
              count={items.length}
              onMove={(f, t) =>
                updateResume((d) => move(d.experience, f, t))
              }
              onRemove={(i) =>
                updateResume((d) => void d.experience.splice(i, 1))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Role"
              value={exp.role}
              placeholder="Senior Engineer"
              onChange={(v) =>
                updateResume((d) => void (d.experience[idx].role = v))
              }
            />
            <Field
              label="Company"
              value={exp.company}
              placeholder="Acme Inc."
              onChange={(v) =>
                updateResume((d) => void (d.experience[idx].company = v))
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Start date"
              value={exp.startDate}
              placeholder="Jan 2022"
              onChange={(v) =>
                updateResume((d) => void (d.experience[idx].startDate = v))
              }
            />
            <Field
              label="End date"
              value={exp.endDate}
              placeholder="Present"
              onChange={(v) =>
                updateResume((d) => void (d.experience[idx].endDate = v))
              }
            />
            <Field
              label="Location"
              value={exp.location}
              placeholder="Remote"
              onChange={(v) =>
                updateResume((d) => void (d.experience[idx].location = v))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={exp.endDate === PRESENT}
              onChange={(e) =>
                updateResume(
                  (d) =>
                    void (d.experience[idx].endDate = e.target.checked
                      ? PRESENT
                      : "")
                )
              }
            />
            Current role (sets end date to “Present”)
          </label>

          <div className="space-y-1">
            <Label>Bullets</Label>
            {exp.bullets.map((bullet, bIdx) => (
              <div key={bIdx} className="flex items-start gap-1">
                <Textarea
                  rows={1}
                  value={bullet}
                  placeholder="Led migration that reduced latency by 40%…"
                  onChange={(e) =>
                    updateResume(
                      (d) =>
                        void (d.experience[idx].bullets[bIdx] = e.target.value)
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove bullet"
                  onClick={() =>
                    updateResume(
                      (d) => void d.experience[idx].bullets.splice(bIdx, 1)
                    )
                  }
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateResume((d) => void d.experience[idx].bullets.push(""))
              }
            >
              <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
              Add bullet
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => updateResume((d) => void d.experience.push(emptyExperience()))}
      >
        <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
        Add experience
      </Button>
      <InlineSuggestions section="experience" />
    </div>
  )
}

export function EducationForm() {
  const { resume, updateResume } = useResumeStore()
  const items = resume.education

  return (
    <div className="space-y-3">
      {items.map((edu, idx) => (
        <div key={edu.id} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Education {idx + 1}
            </span>
            <EntryControls
              index={idx}
              count={items.length}
              onMove={(f, t) => updateResume((d) => move(d.education, f, t))}
              onRemove={(i) =>
                updateResume((d) => void d.education.splice(i, 1))
              }
            />
          </div>
          <Field
            label="Institution"
            value={edu.institution}
            placeholder="State University"
            onChange={(v) =>
              updateResume((d) => void (d.education[idx].institution = v))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Degree"
              value={edu.degree}
              placeholder="B.S."
              onChange={(v) =>
                updateResume((d) => void (d.education[idx].degree = v))
              }
            />
            <Field
              label="Field"
              value={edu.field}
              placeholder="Computer Science"
              onChange={(v) =>
                updateResume((d) => void (d.education[idx].field = v))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Graduation date"
              value={edu.graduationDate}
              placeholder="May 2021"
              onChange={(v) =>
                updateResume((d) => void (d.education[idx].graduationDate = v))
              }
            />
            <Field
              label="GPA (optional)"
              value={edu.gpa ?? ""}
              placeholder="3.8"
              onChange={(v) =>
                updateResume((d) => void (d.education[idx].gpa = v))
              }
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => updateResume((d) => void d.education.push(emptyEducation()))}
      >
        <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
        Add education
      </Button>
      <InlineSuggestions section="education" />
    </div>
  )
}

export function SkillsForm() {
  const { resume, updateResume } = useResumeStore()
  const [draft, setDraft] = React.useState("")

  const addSkill = () => {
    const value = draft.trim()
    if (!value) return
    updateResume((d) => void d.skills.push(value))
    setDraft("")
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="skill-input">Skills</Label>
      <div className="flex gap-2">
        <Input
          id="skill-input"
          value={draft}
          placeholder="Add a skill and press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addSkill()
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          Add
        </Button>
      </div>
      {resume.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {resume.skills.map((skill, idx) => (
            <span
              key={`${skill}-${idx}`}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
            >
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  updateResume((d) => void d.skills.splice(idx, 1))
                }
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <InlineSuggestions section="skills" />
    </div>
  )
}
