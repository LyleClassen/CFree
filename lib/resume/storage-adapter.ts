import { loadResume, saveResume, loadTemplate, saveTemplate } from "@/lib/resume/storage"
import type { Resume, TemplateId } from "@/lib/resume/types"

export interface ResumeStorage {
  load(): Resume | null
  save(resume: Resume): void
}

export interface TemplateStorage {
  load(): TemplateId
  save(template: TemplateId): void
}

export function createLocalStorageAdapter(): {
  resume: ResumeStorage
  template: TemplateStorage
} {
  return {
    resume: { load: loadResume, save: saveResume },
    template: { load: loadTemplate, save: saveTemplate },
  }
}
