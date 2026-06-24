import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { Resume, TemplateId } from "@/lib/resume/types"

// All templates are single-column and use only the PDF standard fonts
// (Helvetica, Times-Roman) so output stays ATS-compatible.

interface TemplateTheme {
  fontFamily: "Helvetica" | "Times-Roman"
  boldFamily: "Helvetica-Bold" | "Times-Bold"
  accent: string
  nameSize: number
  /** Section heading transform. */
  uppercaseHeadings: boolean
  /** Draw a rule under each section heading. */
  headingRule: boolean
  headerAlign: "left" | "center"
}

const THEMES: Record<TemplateId, TemplateTheme> = {
  professional: {
    fontFamily: "Helvetica",
    boldFamily: "Helvetica-Bold",
    accent: "#1f2937",
    nameSize: 22,
    uppercaseHeadings: true,
    headingRule: true,
    headerAlign: "left",
  },
  modern: {
    fontFamily: "Helvetica",
    boldFamily: "Helvetica-Bold",
    accent: "#2563eb",
    nameSize: 24,
    uppercaseHeadings: true,
    headingRule: false,
    headerAlign: "left",
  },
  minimal: {
    fontFamily: "Helvetica",
    boldFamily: "Helvetica-Bold",
    accent: "#111827",
    nameSize: 20,
    uppercaseHeadings: false,
    headingRule: false,
    headerAlign: "left",
  },
  executive: {
    fontFamily: "Times-Roman",
    boldFamily: "Times-Bold",
    accent: "#1f2937",
    nameSize: 24,
    uppercaseHeadings: true,
    headingRule: true,
    headerAlign: "center",
  },
}

function makeStyles(theme: TemplateTheme) {
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 36,
      paddingHorizontal: 44,
      fontFamily: theme.fontFamily,
      fontSize: 10,
      lineHeight: 1.4,
      color: "#1f2937",
    },
    header: {
      marginBottom: 12,
      textAlign: theme.headerAlign,
    },
    name: {
      fontSize: theme.nameSize,
      fontFamily: theme.boldFamily,
      color: theme.accent,
      marginBottom: 4,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      justifyContent: theme.headerAlign === "center" ? "center" : "flex-start",
      fontSize: 9,
      color: "#4b5563",
    },
    section: {
      marginBottom: 12,
    },
    heading: {
      fontSize: 11,
      fontFamily: theme.boldFamily,
      color: theme.accent,
      marginBottom: 6,
      textTransform: theme.uppercaseHeadings ? "uppercase" : "none",
      letterSpacing: theme.uppercaseHeadings ? 1 : 0,
      borderBottomWidth: theme.headingRule ? 1 : 0,
      borderBottomColor: theme.accent,
      paddingBottom: theme.headingRule ? 3 : 0,
    },
    entry: {
      marginBottom: 8,
    },
    entryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    entryTitle: {
      fontFamily: theme.boldFamily,
      fontSize: 10.5,
    },
    entrySub: {
      fontSize: 9.5,
      color: "#374151",
    },
    entryMeta: {
      fontSize: 9,
      color: "#6b7280",
    },
    bulletRow: {
      flexDirection: "row",
      marginTop: 2,
      paddingRight: 6,
    },
    bulletDot: {
      width: 10,
      fontSize: 10,
    },
    bulletText: {
      flex: 1,
    },
    summary: {
      fontSize: 10,
    },
    skills: {
      fontSize: 10,
    },
  })
}

function Section({
  title,
  styles,
  children,
}: {
  title: string
  styles: ReturnType<typeof makeStyles>
  children: React.ReactNode
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  )
}

export function ResumeDocument({
  resume,
  template,
}: {
  resume: Resume
  template: TemplateId
}) {
  const theme = THEMES[template]
  const styles = makeStyles(theme)
  const { header, summary, experience, education, skills } = resume

  const contactParts = [
    header.email,
    header.phone,
    header.location,
    header.linkedin,
  ].filter((p) => p && p.trim().length > 0)

  return (
    <Document title={`${header.fullName || "Resume"}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{header.fullName || "Your Name"}</Text>
          {contactParts.length > 0 && (
            <View style={styles.contactRow}>
              {contactParts.map((part, i) => (
                <Text key={i}>
                  {part}
                  {i < contactParts.length - 1 ? "   •" : ""}
                </Text>
              ))}
            </View>
          )}
        </View>

        {summary.trim().length > 0 && (
          <Section title="Summary" styles={styles}>
            <Text style={styles.summary}>{summary}</Text>
          </Section>
        )}

        {experience.length > 0 && (
          <Section title="Experience" styles={styles}>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entry} wrap={false}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryTitle}>
                    {exp.role || "Role"}
                    {exp.company ? ` — ${exp.company}` : ""}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {exp.location.trim().length > 0 && (
                  <Text style={styles.entrySub}>{exp.location}</Text>
                )}
                {exp.bullets
                  .filter((b) => b.trim().length > 0)
                  .map((bullet, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </Section>
        )}

        {education.length > 0 && (
          <Section title="Education" styles={styles}>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entry} wrap={false}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryTitle}>
                    {[edu.degree, edu.field].filter(Boolean).join(", ") ||
                      "Degree"}
                  </Text>
                  <Text style={styles.entryMeta}>{edu.graduationDate}</Text>
                </View>
                <Text style={styles.entrySub}>
                  {edu.institution}
                  {edu.gpa ? `  ·  GPA: ${edu.gpa}` : ""}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills" styles={styles}>
            <Text style={styles.skills}>{skills.join("  •  ")}</Text>
          </Section>
        )}
      </Page>
    </Document>
  )
}
