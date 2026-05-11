import {
  Paragraph,
  TextRun,
  Table,
  AlignmentType,
  HeadingLevel,
} from 'docx'
import {
  FONT_SIZE,
  LINE_SPACING,
  PARA_SPACING,
  INDENT,
  resolveFontName,
  type FontChoice,
} from './styles'
import { parseMarkdownToTokens } from '@/lib/markdown/markdown-parser'
import { buildDocxTable } from './table-builder'

export interface ReferenceData {
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

interface DiscussionParsed {
  identityLines: Array<{ label: string; value: string }>
  body: string
  references: Array<{ number: string; text: string }>
}

interface AnswerParsed {
  body: string
  references: Array<{ number: string; text: string }>
}

export function parseDiscussionAnswer(answerText: string): DiscussionParsed {
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

  const remaining = lines.slice(bodyStartIndex)
  const { body, references } = splitBodyAndReferences(remaining.join('\n'))
  return { identityLines, body, references }
}

export function parseAnswerWithReferences(answerText: string): AnswerParsed {
  return splitBodyAndReferences(answerText)
}

function splitBodyAndReferences(text: string): AnswerParsed {
  const lines = text.split('\n')
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
    bodyText = text.trim()
  }

  return { body: bodyText, references }
}

export function stripLeadingNumber(text: string): string {
  return text.replace(/^\d+\.\s*/, '').trim()
}

export function buildFormattedTextParagraphs(
  text: string,
  font: FontChoice,
): Array<Paragraph | Table> {
  const fontName = resolveFontName(font)
  const tokens = parseMarkdownToTokens(text)
  const children: Array<Paragraph | Table> = []

  tokens.forEach((tok, idx) => {
    if (tok.type === 'table') {
      children.push(
        buildDocxTable(
          {
            headers: tok.headers,
            rows: tok.rows,
            alignments: tok.alignments,
          },
          font,
        ),
      )
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { before: 0, after: 120 },
        }),
      )
      return
    }

    if (tok.type === 'section_header') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: tok.content,
              bold: true,
              font: fontName,
              size: FONT_SIZE.body,
            }),
          ],
          spacing: {
            before: idx > 0 ? PARA_SPACING.sectionHeader.before : 0,
            after: PARA_SPACING.sectionHeader.after,
            line: LINE_SPACING.body,
          },
        }),
      )
      return
    }

    if (tok.type === 'heading') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: tok.content,
              bold: true,
              font: fontName,
              size: tok.level <= 2 ? FONT_SIZE.heading : FONT_SIZE.body,
            }),
          ],
          spacing: {
            before: idx > 0 ? PARA_SPACING.sectionHeader.before : 0,
            after: PARA_SPACING.sectionHeader.after,
            line: LINE_SPACING.body,
          },
        }),
      )
      return
    }

    if (tok.type === 'list_item') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${tok.marker}\t${tok.content}`,
              font: fontName,
              size: FONT_SIZE.body,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: INDENT.listItemHanging,
            hanging: INDENT.listItemHanging,
          },
          spacing: {
            before: PARA_SPACING.listItem.before,
            after: PARA_SPACING.listItem.after,
            line: LINE_SPACING.body,
          },
        }),
      )
      return
    }

    if (tok.type === 'sub_item') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${tok.marker}\t${tok.content}`,
              font: fontName,
              size: FONT_SIZE.body,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: INDENT.subListPadding + INDENT.subListHanging,
            hanging: INDENT.subListHanging,
          },
          spacing: {
            before: PARA_SPACING.subListItem.before,
            after: PARA_SPACING.subListItem.after,
            line: LINE_SPACING.body,
          },
        }),
      )
      return
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: tok.content,
            font: fontName,
            size: FONT_SIZE.body,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: {
          before: PARA_SPACING.body.before,
          after: PARA_SPACING.body.after,
          line: LINE_SPACING.body,
        },
      }),
    )
  })

  return children
}

export function buildIdentityParagraphs(
  identityLines: Array<{ label: string; value: string }>,
  font: FontChoice,
): Paragraph[] {
  const fontName = resolveFontName(font)
  return identityLines.map(
    (id) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `${id.label.padEnd(5)}: ${id.value}`,
            font: fontName,
            size: FONT_SIZE.body,
          }),
        ],
        spacing: {
          before: 0,
          after: 40,
          line: LINE_SPACING.body,
        },
      }),
  )
}

export function buildReferenceParagraphs(
  references: Array<{ number: string; text: string }>,
  font: FontChoice,
): Paragraph[] {
  if (references.length === 0) return []
  const fontName = resolveFontName(font)

  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Referensi:',
          bold: true,
          font: fontName,
          size: FONT_SIZE.body,
        }),
      ],
      spacing: {
        before: PARA_SPACING.referenceHeader.before,
        after: PARA_SPACING.referenceHeader.after,
        line: LINE_SPACING.body,
      },
    }),
  ]

  references.forEach((ref) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${ref.number}\t${ref.text}`,
            font: fontName,
            size: FONT_SIZE.body,
          }),
        ],
        indent: {
          left: INDENT.listItemHanging,
          hanging: INDENT.listItemHanging,
        },
        spacing: {
          before: PARA_SPACING.referenceItem.before,
          after: PARA_SPACING.referenceItem.after,
          line: LINE_SPACING.body,
        },
      }),
    )
  })

  return paragraphs
}

export function buildCenteredHeading(
  text: string,
  font: FontChoice,
): Paragraph {
  const fontName = resolveFontName(font)
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        font: fontName,
        size: FONT_SIZE.body,
      }),
    ],
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 0,
      after: 400,
      line: LINE_SPACING.body,
    },
  })
}

export function buildQuestionNumberHeading(
  number: number,
  font: FontChoice,
): Paragraph {
  const fontName = resolveFontName(font)
  return new Paragraph({
    children: [
      new TextRun({
        text: `Jawaban No. ${number}`,
        bold: true,
        font: fontName,
        size: FONT_SIZE.body,
      }),
    ],
    spacing: {
      before: 0,
      after: 300,
      line: LINE_SPACING.body,
    },
  })
}

export function buildTaskDescriptionParagraph(
  description: string,
  font: FontChoice,
): Paragraph {
  const fontName = resolveFontName(font)
  return new Paragraph({
    children: [
      new TextRun({
        text: description,
        font: fontName,
        size: FONT_SIZE.body,
      }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 0,
      after: 300,
      line: LINE_SPACING.body,
    },
  })
}

export function buildNumberedSoalItem(
  number: number,
  questionText: string,
  font: FontChoice,
): Paragraph {
  const fontName = resolveFontName(font)
  return new Paragraph({
    children: [
      new TextRun({
        text: `${number}.\t${questionText}`,
        font: fontName,
        size: FONT_SIZE.body,
      }),
    ],
    alignment: AlignmentType.JUSTIFIED,
    indent: {
      left: INDENT.listItemHanging,
      hanging: INDENT.listItemHanging,
    },
    spacing: {
      before: 0,
      after: PARA_SPACING.listItem.after,
      line: LINE_SPACING.body,
    },
  })
}
