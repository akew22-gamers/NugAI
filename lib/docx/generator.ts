import {
  Document,
  Packer,
  Paragraph,
  Table,
  PageOrientation,
  PageBreak,
  TextRun,
} from 'docx'
import { PAGE_MARGINS, resolveFontName, type FontChoice } from './styles'
import { buildUTCoverChildren } from './cover-builder'
import {
  parseDiscussionAnswer,
  parseAnswerWithReferences,
  stripLeadingNumber,
  buildFormattedTextParagraphs,
  buildIdentityParagraphs,
  buildReferenceParagraphs,
  buildCenteredHeading,
  buildQuestionNumberHeading,
  buildTaskDescriptionParagraph,
  buildNumberedSoalItem,
  type ReferenceData,
} from './content-builder'

export interface DocxTaskItemData {
  question_text: string
  answer_text: string
  references_used?: ReferenceData[]
}

export interface DocxData {
  taskType: 'DISCUSSION' | 'ASSIGNMENT'
  courseName: string
  courseCode?: string | null
  moduleName: string
  tutorName: string
  studentName: string
  studentNim: string
  universityName: string
  faculty: string
  studyProgram: string
  upbjjBranch?: string
  universityLogoUrl: string
  taskItems: DocxTaskItemData[]
  taskDescription?: string
  includeDescription?: boolean
  createdAt: Date
  withCover?: boolean
  sessionNumber?: number
  fontFamily?: FontChoice
}

function collectReferences(items: DocxTaskItemData[]): Array<{ number: string; text: string }> {
  const values = items.flatMap((item) => {
    const references = item.references_used as unknown as { references?: ReferenceData[] } | ReferenceData[] | undefined
    return Array.isArray(references) ? references : references?.references || []
  })
  const unique = values.filter((reference, index) => reference.title && values.findIndex((other) => (other.url || other.title) === (reference.url || reference.title)) === index)
  return unique.map((reference, index) => ({ number: `${index + 1}.`, text: `${reference.author ? `${reference.author}. ` : ''}${reference.year ? `(${reference.year}). ` : ''}${reference.title}.${reference.url ? ` ${reference.url}` : ''}` }))
}

function pageBreakParagraph(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ children: [new PageBreak()] })],
  })
}

function buildDiscussionChildren(
  data: DocxData,
  font: FontChoice,
): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = []

  children.push(...buildIdentityParagraphs([{ label: 'Nama', value: data.studentName }, { label: 'NIM', value: data.studentNim }], font))

  const parsedAnswers = data.taskItems.map((item) => parseDiscussionAnswer(item.answer_text))

  parsedAnswers.forEach((parsed, index) => {
    if (index > 0) {
      children.push(pageBreakParagraph())
    }

    children.push(buildQuestionNumberHeading(index + 1, font))
    children.push(...buildFormattedTextParagraphs(parsed.body, font))
  })

  const storedReferences = collectReferences(data.taskItems)
  const embeddedReferences = parsedAnswers.flatMap((parsed) => parsed.references)
  children.push(...buildReferenceParagraphs(storedReferences.length > 0 ? storedReferences : embeddedReferences, font))

  return children
}

function buildAssignmentChildren(
  data: DocxData,
  font: FontChoice,
): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = []

  children.push(buildCenteredHeading('SOAL', font))

  if (data.includeDescription !== false && data.taskDescription) {
    children.push(buildTaskDescriptionParagraph(data.taskDescription, font))
  }

  data.taskItems.forEach((item, idx) => {
    children.push(buildNumberedSoalItem(idx + 1, item.question_text, font))
  })

  children.push(pageBreakParagraph())
  children.push(buildCenteredHeading('JAWABAN', font))

  data.taskItems.forEach((item, idx) => {
    if (idx > 0) {
      children.push(pageBreakParagraph())
    }

    const { body } = parseAnswerWithReferences(item.answer_text)
    const cleanBody = stripLeadingNumber(body)

    children.push(buildQuestionNumberHeading(idx + 1, font))
    children.push(...buildFormattedTextParagraphs(cleanBody, font))

  })

  const storedAssignmentReferences = collectReferences(data.taskItems)
  if (storedAssignmentReferences.length > 0) {
    children.push(pageBreakParagraph())
    children.push(...buildReferenceParagraphs(storedAssignmentReferences, font))
  }

  return children
}

export async function generateDocx(data: DocxData): Promise<Buffer> {
  const font = data.fontFamily || 'Times-Roman'
  const fontName = resolveFontName(font)

  const sections: Array<{
    properties: {
      page: {
        margin: typeof PAGE_MARGINS
        size?: { orientation: typeof PageOrientation.PORTRAIT }
      }
    }
    children: Array<Paragraph | Table>
  }> = []

  if (data.withCover) {
    sections.push({
      properties: {
        page: {
          margin: PAGE_MARGINS,
          size: { orientation: PageOrientation.PORTRAIT },
        },
      },
      children: buildUTCoverChildren({
        sessionNumber: data.sessionNumber,
        courseName: data.courseName,
        courseCode: data.courseCode,
        tutorName: data.tutorName,
        studentName: data.studentName,
        studentNim: data.studentNim,
        studyProgram: data.studyProgram,
        faculty: data.faculty,
        upbjjBranch: data.upbjjBranch,
        fontFamily: font,
      }),
    })
  }

  const contentChildren =
    data.taskType === 'DISCUSSION'
      ? buildDiscussionChildren(data, font)
      : buildAssignmentChildren(data, font)

  sections.push({
    properties: {
      page: {
        margin: PAGE_MARGINS,
        size: { orientation: PageOrientation.PORTRAIT },
      },
    },
    children: contentChildren,
  })

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontName,
            size: 24,
          },
          paragraph: {
            spacing: { line: 276 },
          },
        },
      },
    },
    sections,
  })

  return await Packer.toBuffer(doc)
}
