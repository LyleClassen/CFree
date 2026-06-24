import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { Resume, TemplateId } from "@/lib/resume/types"

// All templates are single-column and use only the PDF standard fonts
// (Helvetica, Times-Roman) so output stays ATS-compatible. Personality comes
// from hierarchy, rhythm, rules, and a single accent — never from exotic fonts.

type HeaderStyle = "band" | "underline" | "centered" | "minimal"
type HeadingStyle = "rule" | "bar" | "plain" | "flanked"

interface TemplateTheme {
  font: "Helvetica" | "Times-Roman"
  bold: "Helvetica-Bold" | "Times-Bold"
  ink: string
  muted: string
  faint: string
  accent: string
  nameSize: number
  nameTracking: number
  uppercaseName: boolean
  headerAlign: "left" | "center"
  headerStyle: HeaderStyle
  headingStyle: HeadingStyle
  uppercaseHeadings: boolean
  headingTracking: number
  padX: number
  padY: number
  sectionGap: number
}

const THEMES: Record<TemplateId, TemplateTheme> = {
  // Ledger — classic, authoritative. Hairline under the whole header, tracked
  // caps headings ruled across the column, company set in accent.
  professional: {
    font: "Helvetica",
    bold: "Helvetica-Bold",
    ink: "#1e293b",
    muted: "#475569",
    faint: "#94a3b8",
    accent: "#334155",
    nameSize: 23,
    nameTracking: 0,
    uppercaseName: false,
    headerAlign: "left",
    headerStyle: "band",
    headingStyle: "rule",
    uppercaseHeadings: true,
    headingTracking: 1.4,
    padX: 46,
    padY: 42,
    sectionGap: 13,
  },
  // Aperture — contemporary. A short accent rule under the name, a filled
  // accent marker before each heading, teal that ties back to the product.
  modern: {
    font: "Helvetica",
    bold: "Helvetica-Bold",
    ink: "#0f172a",
    muted: "#475569",
    faint: "#94a3b8",
    accent: "#0f766e",
    nameSize: 25,
    nameTracking: -0.4,
    uppercaseName: false,
    headerAlign: "left",
    headerStyle: "underline",
    headingStyle: "bar",
    uppercaseHeadings: true,
    headingTracking: 1.2,
    padX: 48,
    padY: 44,
    sectionGap: 14,
  },
  // Quiet — restrained. Small name, tracked-caps contact line, mixed-case
  // headings with maximum air and no rules at all.
  minimal: {
    font: "Helvetica",
    bold: "Helvetica-Bold",
    ink: "#171717",
    muted: "#525252",
    faint: "#a3a3a3",
    accent: "#171717",
    nameSize: 19,
    nameTracking: 0.2,
    uppercaseName: false,
    headerAlign: "left",
    headerStyle: "minimal",
    headingStyle: "plain",
    uppercaseHeadings: false,
    headingTracking: 0.4,
    padX: 58,
    padY: 54,
    sectionGap: 18,
  },
  // Broadsheet — editorial serif. Centered tracked-caps name framed by rules,
  // section headings centered between hairlines.
  executive: {
    font: "Times-Roman",
    bold: "Times-Bold",
    ink: "#1f2937",
    muted: "#4b5563",
    faint: "#9ca3af",
    accent: "#1f2937",
    nameSize: 25,
    nameTracking: 2.4,
    uppercaseName: true,
    headerAlign: "center",
    headerStyle: "centered",
    headingStyle: "flanked",
    uppercaseHeadings: true,
    headingTracking: 2,
    padX: 56,
    padY: 50,
    sectionGap: 15,
  },
}

function makeStyles(t: TemplateTheme) {
  return StyleSheet.create({
    page: {
      paddingTop: t.padY,
      paddingBottom: t.padY,
      paddingHorizontal: t.padX,
      fontFamily: t.font,
      fontSize: 10,
      lineHeight: 1.42,
      color: t.ink,
    },
    header: {
      marginBottom: 14,
      textAlign: t.headerAlign,
    },
    name: {
      fontSize: t.nameSize,
      fontFamily: t.bold,
      color: t.ink,
      lineHeight: 1.1,
      letterSpacing: t.nameTracking,
      textTransform: t.uppercaseName ? "uppercase" : "none",
    },
    nameUnderline: {
      marginTop: 5,
      width: 38,
      height: 2.4,
      backgroundColor: t.accent,
    },
    headerHairline: {
      marginTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: t.ink,
    },
    rulesAbove: {
      borderTopWidth: 0.75,
      borderTopColor: t.faint,
      marginTop: 8,
      paddingTop: 6,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 6,
      justifyContent: t.headerAlign === "center" ? "center" : "flex-start",
      fontSize: 9,
      color: t.muted,
    },
    contactDivider: {
      color: t.faint,
      marginHorizontal: 5,
    },
    section: {
      marginBottom: t.sectionGap,
    },
    // "rule" heading: tracked caps with a hairline across the column.
    headingRule: {
      fontSize: 10.5,
      fontFamily: t.bold,
      color: t.accent,
      marginBottom: 7,
      textTransform: "uppercase",
      letterSpacing: t.headingTracking,
      borderBottomWidth: 1,
      borderBottomColor: t.accent,
      paddingBottom: 3,
    },
    // "bar" heading: filled accent marker + label.
    headingBarRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 7,
    },
    headingBarMark: {
      width: 9,
      height: 9,
      backgroundColor: t.accent,
      marginRight: 7,
    },
    headingBarText: {
      fontSize: 10.5,
      fontFamily: t.bold,
      color: t.ink,
      textTransform: "uppercase",
      letterSpacing: t.headingTracking,
    },
    // "plain" heading: quiet mixed-case label, lots of air.
    headingPlain: {
      fontSize: 11,
      fontFamily: t.bold,
      color: t.ink,
      marginBottom: 8,
      letterSpacing: t.headingTracking,
    },
    // "flanked" heading: centered caps between two hairlines.
    headingFlankRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 9,
    },
    headingFlankLine: {
      flex: 1,
      borderBottomWidth: 0.75,
      borderBottomColor: t.faint,
    },
    headingFlankText: {
      fontSize: 10.5,
      fontFamily: t.bold,
      color: t.accent,
      textTransform: "uppercase",
      letterSpacing: t.headingTracking,
      marginHorizontal: 9,
    },
    entry: {
      marginBottom: 9,
    },
    entryTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    entryTitle: {
      fontFamily: t.bold,
      fontSize: 10.5,
      color: t.ink,
    },
    entryCompany: {
      fontFamily: t.bold,
      fontSize: 10.5,
      color: t.accent,
    },
    entrySub: {
      fontSize: 9.5,
      color: t.muted,
      marginTop: 1,
    },
    entryMeta: {
      fontSize: 9,
      fontFamily: t.font,
      color: t.muted,
    },
    bulletRow: {
      flexDirection: "row",
      marginTop: 3,
      paddingRight: 4,
    },
    bulletDot: {
      width: 11,
      fontSize: 9,
      color: t.accent,
    },
    bulletText: {
      flex: 1,
      color: t.ink,
    },
    summary: {
      fontSize: 10,
      color: t.ink,
    },
    skillsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    skillChip: {
      fontSize: 9.5,
      color: t.muted,
      marginRight: 6,
      marginBottom: 3,
    },
    skillSep: {
      color: t.faint,
    },
  })
}

function Heading({
  title,
  theme,
  styles,
}: {
  title: string
  theme: TemplateTheme
  styles: ReturnType<typeof makeStyles>
}) {
  switch (theme.headingStyle) {
    case "bar":
      return (
        <View style={styles.headingBarRow}>
          <View style={styles.headingBarMark} />
          <Text style={styles.headingBarText}>{title}</Text>
        </View>
      )
    case "plain":
      return <Text style={styles.headingPlain}>{title}</Text>
    case "flanked":
      return (
        <View style={styles.headingFlankRow}>
          <View style={styles.headingFlankLine} />
          <Text style={styles.headingFlankText}>{title}</Text>
          <View style={styles.headingFlankLine} />
        </View>
      )
    case "rule":
    default:
      return <Text style={styles.headingRule}>{title}</Text>
  }
}

function Section({
  title,
  theme,
  styles,
  children,
}: {
  title: string
  theme: TemplateTheme
  styles: ReturnType<typeof makeStyles>
  children: React.ReactNode
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Heading title={title} theme={theme} styles={styles} />
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

  const Contact =
    contactParts.length > 0 ? (
      <View style={styles.contactRow}>
        {contactParts.map((part, i) => (
          <Text key={i}>
            {part}
            {i < contactParts.length - 1 && (
              <Text style={styles.contactDivider}>
                {theme.headingStyle === "flanked" ? "  ·  " : "   •   "}
              </Text>
            )}
          </Text>
        ))}
      </View>
    ) : null

  return (
    <Document title={`${header.fullName || "Resume"}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{header.fullName || "Your Name"}</Text>

          {theme.headerStyle === "underline" && (
            <View style={styles.nameUnderline} />
          )}

          {/* Executive frames the contact line between two hairlines. */}
          {theme.headerStyle === "centered" ? (
            <View style={styles.rulesAbove}>{Contact}</View>
          ) : (
            Contact
          )}

          {(theme.headerStyle === "band" ||
            theme.headerStyle === "centered") && (
            <View style={styles.headerHairline} />
          )}
        </View>

        {summary.trim().length > 0 && (
          <Section title="Summary" theme={theme} styles={styles}>
            <Text style={styles.summary}>{summary}</Text>
          </Section>
        )}

        {experience.length > 0 && (
          <Section title="Experience" theme={theme} styles={styles}>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entry} wrap={false}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryTitle}>
                    {exp.role || "Role"}
                    {exp.company ? (
                      <Text style={styles.entryCompany}>
                        {"  ·  "}
                        {exp.company}
                      </Text>
                    ) : (
                      ""
                    )}
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
                      <Text style={styles.bulletDot}>
                        {theme.headingStyle === "flanked" ? "—" : "•"}
                      </Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
              </View>
            ))}
          </Section>
        )}

        {education.length > 0 && (
          <Section title="Education" theme={theme} styles={styles}>
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
                  {edu.gpa ? `   ·   GPA ${edu.gpa}` : ""}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills" theme={theme} styles={styles}>
            <View style={styles.skillsWrap}>
              {skills.map((skill, i) => (
                <Text key={i} style={styles.skillChip}>
                  {skill}
                  {i < skills.length - 1 && (
                    <Text style={styles.skillSep}>{"   /"}</Text>
                  )}
                </Text>
              ))}
            </View>
          </Section>
        )}
      </Page>
    </Document>
  )
}
