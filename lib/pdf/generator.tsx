import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from '@react-pdf/renderer'
import { registerFonts, getFontFamily } from './font-loader'
import { PAGE_SIZE, PAGE_MARGIN } from './styles'

interface ReferenceData {
  type: 'module' | 'journal' | 'book' | 'government' | 'web'
  title: string
  author?: string
  authors?: string[]
  year?: string
  publisher?: string
  journal_name?: string
  volume?: string
  issue?: string
  pages?: string
  url?: string
  doi?: string
  source?: string
}

interface TaskItemData {
  question_text: string
  answer_text: string
  references_used?: ReferenceData[]
}

interface PDFData {
  taskType: 'DISCUSSION' | 'ASSIGNMENT'
  courseName: string
  moduleName: string
  tutorName: string
  studentName: string
  studentNim: string
  universityName: string
  faculty: string
  studyProgram: string
  upbjjBranch?: string
  universityLogoUrl: string
  taskItems: TaskItemData[]
  createdAt: Date
}

const styles = StyleSheet.create({
  page: {
    fontFamily: getFontFamily(),
    fontSize: 12,
    lineHeight: 1.15,
    padding: PAGE_MARGIN,
  },
  coverPage: {
    padding: PAGE_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  coverLogo: {
    width: 150,
    marginBottom: 30,
  },
  coverSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  coverSectionContent: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  coverFooter: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
  },
  coverFooterLine: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  discussionBody: {
    fontFamily: getFontFamily(),
    fontSize: 12,
    lineHeight: 1.15,
    textAlign: 'justify',
  },
  referenceSection: {
    marginTop: 20,
  },
  referenceHeader: {
    fontSize: 12,
    marginBottom: 10,
  },
  referenceItem: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 1.15,
    flexDirection: 'row',
  },
  referenceNumber: {
    fontSize: 11,
    lineHeight: 1.15,
    width: 18,
  },
  referenceText: {
    fontSize: 11,
    lineHeight: 1.15,
    flex: 1,
  },
  identityRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  identityLabel: {
    fontSize: 12,
    width: 45,
  },
  identitySeparator: {
    fontSize: 12,
    width: 15,
    textAlign: 'center',
  },
  identityValue: {
    fontSize: 12,
    flex: 1,
  },
  identitySection: {
    marginBottom: 12,
  },
  soalListHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  soalItem: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.15,
  },
  soalNumber: {
    fontWeight: 'bold',
  },
  questionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
  },
})

function formatReference(ref: ReferenceData): string {
  if (!ref || !ref.title) return ''
  
  switch (ref.type) {
    case 'module':
      if (!ref.author) return `${ref.title}. ${ref.year}. ${ref.publisher}.`
      return `${ref.author}. ${ref.year}. ${ref.title}. ${ref.publisher}.`
    case 'journal':
      const authors = ref.authors?.join(', ') || ref.author || ''
      if (!authors && !ref.title) return ''
      return `${authors}. (${ref.year}). ${ref.title}. ${ref.journal_name || ''}, ${ref.volume || ''}(${ref.issue || ''}), ${ref.pages || ''}.`
    case 'book':
      if (!ref.author) return `${ref.title}. ${ref.year}. ${ref.publisher}.`
      return `${ref.author}. ${ref.year}. ${ref.title}. ${ref.publisher}.`
    case 'government':
      return `${ref.title}. (${ref.year}). ${ref.url || ''}`
    default:
      return `${ref.title}. ${ref.url || ''}`
  }
}

function parseDiscussionAnswer(answerText: string): {
  identityLines: Array<{ label: string; value: string }>
  body: string
  references: Array<{ number: string; text: string }>
} {
  const lines = answerText.split('\n')
  const identityLines: Array<{ label: string; value: string }> = []
  let bodyStartIndex = 0

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim()
    const match = line.match(/^(Nama|NIM)\s*:\s*(.+)$/i)
    if (match) {
      identityLines.push({ label: match[1], value: match[2].trim() })
      bodyStartIndex = i + 1
    } else if (line === '' && identityLines.length > 0) {
      bodyStartIndex = i + 1
    } else if (identityLines.length > 0) {
      break
    } else if (line !== '') {
      break
    }
  }

  const remainingLines = lines.slice(bodyStartIndex)
  let refSectionIndex = -1
  for (let i = remainingLines.length - 1; i >= 0; i--) {
    if (remainingLines[i].trim().toLowerCase() === 'referensi:' || remainingLines[i].trim().toLowerCase() === 'referensi') {
      refSectionIndex = i
      break
    }
  }

  const references: Array<{ number: string; text: string }> = []
  let bodyText: string

  if (refSectionIndex >= 0) {
    bodyText = remainingLines.slice(0, refSectionIndex).join('\n').trim()
    const refLines = remainingLines.slice(refSectionIndex + 1)
    let currentRef: { number: string; text: string } | null = null

    for (const line of refLines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const refMatch = trimmed.match(/^(\d+)\.\s*(.+)$/)
      if (refMatch) {
        if (currentRef) references.push(currentRef)
        currentRef = { number: refMatch[1] + '.', text: refMatch[2] }
      } else if (currentRef) {
        currentRef.text += ' ' + trimmed
      }
    }
    if (currentRef) references.push(currentRef)
  } else {
    bodyText = remainingLines.join('\n').trim()
  }

  return { identityLines, body: bodyText, references }
}

function DiscussionTemplate({ data }: { data: PDFData }) {
  const allAnswers = data.taskItems.map(item => item.answer_text)
  
  return (
    <Document>
      <Page size={PAGE_SIZE} style={styles.page}>
        {allAnswers.map((answer, index) => {
          const { identityLines, body, references } = parseDiscussionAnswer(answer)
          return (
            <View key={index}>
              {identityLines.length > 0 && (
                <View style={styles.identitySection}>
                  {identityLines.map((id, idx) => (
                    <View key={idx} style={styles.identityRow}>
                      <Text style={styles.identityLabel}>{id.label}</Text>
                      <Text style={styles.identitySeparator}>:</Text>
                      <Text style={styles.identityValue}>{id.value}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.discussionBody}>{body}</Text>
              {references.length > 0 && (
                <View style={styles.referenceSection}>
                  <Text style={styles.referenceHeader}>Referensi:</Text>
                  {references.map((ref, refIdx) => (
                    <View key={refIdx} style={styles.referenceItem}>
                      <Text style={styles.referenceNumber}>{ref.number}</Text>
                      <Text style={styles.referenceText}>{ref.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

function parseAnswerWithReferences(answerText: string): {
  body: string
  references: Array<{ number: string; text: string }>
} {
  const lines = answerText.split('\n')
  let refSectionIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim().toLowerCase()
    if (trimmed === 'referensi:' || trimmed === 'referensi') {
      refSectionIndex = i
      break
    }
  }

  const references: Array<{ number: string; text: string }> = []
  let bodyText: string

  if (refSectionIndex >= 0) {
    bodyText = lines.slice(0, refSectionIndex).join('\n').trim()
    const refLines = lines.slice(refSectionIndex + 1)
    let currentRef: { number: string; text: string } | null = null

    for (const line of refLines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const refMatch = trimmed.match(/^(\d+)\.\s*(.+)$/)
      if (refMatch) {
        if (currentRef) references.push(currentRef)
        currentRef = { number: refMatch[1] + '.', text: refMatch[2] }
      } else if (currentRef) {
        currentRef.text += ' ' + trimmed
      }
    }
    if (currentRef) references.push(currentRef)
  } else {
    bodyText = answerText.trim()
  }

  return { body: bodyText, references }
}

function stripLeadingNumber(text: string): string {
  return text.replace(/^\d+\.\s*/, '').trim()
}

function AssignmentTemplate({ data }: { data: PDFData }) {
  return (
    <Document>
      <Page size={PAGE_SIZE} style={styles.page}>
        <Text style={styles.soalListHeader}>SOAL</Text>
        {data.taskItems.map((item, index) => (
          <View key={index} style={styles.soalItem}>
            <View style={styles.referenceItem}>
              <Text style={styles.referenceNumber}>{index + 1}.</Text>
              <Text style={styles.referenceText}>{item.question_text}</Text>
            </View>
          </View>
        ))}
      </Page>

      <Page size={PAGE_SIZE} style={styles.page} wrap>
        <Text style={styles.soalListHeader}>JAWABAN</Text>
        {data.taskItems.map((item, index) => {
          const { body, references } = parseAnswerWithReferences(item.answer_text)
          const cleanBody = stripLeadingNumber(body)
          return (
            <View key={index} style={{ marginBottom: 24 }}>
              <Text style={styles.questionHeader}>Jawaban No. {index + 1}</Text>
              <Text style={styles.discussionBody}>{cleanBody}</Text>
              {references.length > 0 && (
                <View style={styles.referenceSection}>
                  <Text style={styles.referenceHeader}>Referensi:</Text>
                  {references.map((ref, refIdx) => (
                    <View key={refIdx} style={styles.referenceItem}>
                      <Text style={styles.referenceNumber}>{ref.number}</Text>
                      <Text style={styles.referenceText}>{ref.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </Page>
    </Document>
  )
}

export async function generatePDF(data: PDFData): Promise<Buffer> {
  try {
    registerFonts()
  } catch (e) {
    console.error('Font registration failed, using default:', e)
  }
  
  const document = data.taskType === 'DISCUSSION' 
    ? DiscussionTemplate({ data })
    : AssignmentTemplate({ data })
  
  const stream = await pdf(document).toBuffer()
  const chunks: Uint8Array[] = []
  
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

export type { PDFData, TaskItemData, ReferenceData }