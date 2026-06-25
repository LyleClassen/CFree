import { describe, it, expect } from "vitest"
import {
  makeId,
  emptyResume,
  emptyExperience,
  emptySkillGroup,
  emptyEducation,
} from "@/lib/resume/factory"

describe("factory", () => {
  describe("makeId", () => {
    it("returns a non-empty string", () => {
      expect(makeId()).toBeTruthy()
    })

    it("returns unique values on successive calls", () => {
      const a = makeId()
      const b = makeId()
      expect(a).not.toBe(b)
    })
  })

  describe("emptyResume", () => {
    it("returns a resume with all sections empty", () => {
      const r = emptyResume()
      expect(r.header.fullName).toBe("")
      expect(r.header.email).toBe("")
      expect(r.header.phone).toBe("")
      expect(r.header.city).toBe("")
      expect(r.header.country).toBe("")
      expect(r.header.linkedin).toBe("")
      expect(r.summary).toBe("")
      expect(r.experience).toEqual([])
      expect(r.education).toEqual([])
      expect(r.skills).toEqual([])
    })
  })

  describe("emptyExperience", () => {
    it("returns an experience entry with default values", () => {
      const e = emptyExperience()
      expect(e.company).toBe("")
      expect(e.role).toBe("")
      expect(e.startDate).toBe("")
      expect(e.endDate).toBe("")
      expect(e.location).toBe("")
      expect(e.bullets).toEqual([""])
      expect(e.id).toBeTruthy()
    })
  })

  describe("emptySkillGroup", () => {
    it("returns a skill group with the given name", () => {
      const g = emptySkillGroup("Front-End")
      expect(g.name).toBe("Front-End")
      expect(g.items).toEqual([])
      expect(g.id).toBeTruthy()
    })

    it("defaults name to empty string", () => {
      const g = emptySkillGroup()
      expect(g.name).toBe("")
    })
  })

  describe("emptyEducation", () => {
    it("returns an education entry with default values", () => {
      const e = emptyEducation()
      expect(e.institution).toBe("")
      expect(e.degree).toBe("")
      expect(e.field).toBe("")
      expect(e.graduationDate).toBe("")
      expect(e.gpa).toBe("")
      expect(e.id).toBeTruthy()
    })
  })
})
