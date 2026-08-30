import { Document, Page, Text, View, StyleSheet, Svg, Path, Rect } from "@react-pdf/renderer"

/**
 * The certificate.
 *
 * Deliberately NOT the app's visual language: no glass, no dark background, no
 * gradient. It is a formal printable document (docs/CERTIFICATES.md) that has
 * to survive a black-and-white office printer and look right in a frame.
 * Ink-light, high contrast, A4 landscape.
 */

const NAVY = "#1E223D"
const INK = "#12162B"
const MUTED = "#64748B"
const RULE = "#D1D5DB"
const ACCENT = "#F54F1B"

const styles = StyleSheet.create({
  page: {
    paddingTop: 46,
    paddingBottom: 40,
    paddingHorizontal: 54,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    position: "relative",
  },
  frame: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    borderWidth: 1.5,
    borderColor: NAVY,
    borderStyle: "solid",
  },
  frameInner: {
    position: "absolute",
    top: 28,
    left: 28,
    right: 28,
    bottom: 28,
    borderWidth: 0.6,
    borderColor: ACCENT,
    borderStyle: "solid",
  },
  // Grows to fill the space between header and footer, keeping the name and
  // score optically centred on the sheet at any content length.
  body_band: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 4 },
  institution: {
    fontSize: 11,
    letterSpacing: 2.6,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontFamily: "Times-Bold",
    color: NAVY,
    letterSpacing: 1.2,
    marginTop: 12,
  },
  rule: { width: 62, height: 2, backgroundColor: ACCENT, marginTop: 12, marginBottom: 16 },
  presented: { fontSize: 10.5, color: MUTED, letterSpacing: 0.5 },
  name: {
    fontSize: 34,
    fontFamily: "Times-BoldItalic",
    color: INK,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  nameRule: { width: 320, height: 0.8, backgroundColor: RULE, marginBottom: 16 },
  body: {
    fontSize: 11.5,
    color: INK,
    lineHeight: 1.6,
    textAlign: "center",
    maxWidth: 470,
    marginBottom: 20,
  },
  scoreRow: { flexDirection: "row", justifyContent: "center", gap: 0, marginBottom: 4 },
  scoreCell: { alignItems: "center", paddingHorizontal: 26 },
  scoreDivider: { width: 0.8, backgroundColor: RULE, marginVertical: 4 },
  scoreValue: { fontSize: 21, fontFamily: "Helvetica-Bold", color: ACCENT },
  scoreLabel: {
    fontSize: 7.5,
    color: MUTED,
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: "uppercase",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 14,
  },
  footerCol: { width: 190 },
  sigLine: { height: 0.8, backgroundColor: INK, marginBottom: 6 },
  sigName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: INK },
  sigTitle: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  metaLabel: { fontSize: 7.5, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase" },
  metaValue: { fontSize: 9.5, color: INK, marginTop: 3 },
  certId: { fontSize: 8, color: MUTED, fontFamily: "Courier", marginTop: 3 },
})

export interface CertificateData {
  studentName: string
  score: number
  total: number
  percentage: number
  htmlScore: number
  cssScore: number
  javascriptScore: number
  pythonScore: number
  certificateNumber: string
  eventDate: string
  collegeName: string
  workshopName: string
  organizerName: string
  organizerTitle: string
}

function Seal() {
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54">
      <Path
        d="M27 3 L32 9 L40 7 L42 15 L50 18 L47 26 L52 33 L45 37 L45 45 L37 45 L32 51 L27 46 L22 51 L17 45 L9 45 L9 37 L2 33 L7 26 L4 18 L12 15 L14 7 L22 9 Z"
        fill="#ffffff"
        stroke={ACCENT}
        strokeWidth={1.2}
      />
      <Path
        d="M18 27 l6 6 l12 -13"
        stroke={ACCENT}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function LogoMark() {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Rect x={1} y={1} width={38} height={38} rx={10} stroke={ACCENT} strokeWidth={1.4} fill="none" />
      <Path
        d="M15 13.5 L9.5 20 L15 26.5 M25 13.5 L30.5 20 L25 26.5 M22.2 11.5 L17.8 28.5"
        stroke={NAVY}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function CertificateDocument(data: CertificateData) {
  return (
    <Document
      title={`Certificate — ${data.studentName}`}
      author={data.collegeName}
      subject={data.workshopName}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame} fixed />
        <View style={styles.frameInner} fixed />

        <View style={styles.header}>
          <LogoMark />
          <Text style={[styles.institution, { marginTop: 8 }]}>{data.collegeName}</Text>
          <Text style={styles.title}>Certificate of Achievement</Text>
          <View style={styles.rule} />
        </View>

        <View style={styles.body_band}>
          <Text style={styles.presented}>This is to certify that</Text>
          <Text style={styles.name}>{data.studentName}</Text>
          <View style={styles.nameRule} />

          <Text style={styles.body}>
            successfully completed the {data.workshopName}, covering HTML, CSS and JavaScript, and
            demonstrated the required standard in the concluding assessment.
          </Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCell}>
              <Text style={styles.scoreValue}>
                {data.score}/{data.total}
              </Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCell}>
              <Text style={styles.scoreValue}>{data.percentage}%</Text>
              <Text style={styles.scoreLabel}>Percentage</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreCell}>
              <Text style={styles.scoreValue}>
                {data.htmlScore} · {data.cssScore} · {data.javascriptScore} · {data.pythonScore}
              </Text>
              <Text style={styles.scoreLabel}>HTML · CSS · JS · PY</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{data.organizerName}</Text>
            <Text style={styles.sigTitle}>{data.organizerTitle}</Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Seal />
          </View>

          <View style={[styles.footerCol, { alignItems: "flex-end" }]}>
            <Text style={styles.metaLabel}>Date of issue</Text>
            <Text style={styles.metaValue}>{data.eventDate}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Certificate ID</Text>
            <Text style={styles.certId}>{data.certificateNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
