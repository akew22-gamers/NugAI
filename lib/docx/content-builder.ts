import {
  Paragraph,
  TextRun,
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

type ParsedElement =
  | { type: 'paragraph'; content: string }
  | { type: 'list_item'; marker: string; content: string }
  | { type: 'sub_item'; marker: string; content: string }
  | { type: 'section_header'; content: string }

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

function parseFormattedText(text: string): ParsedElement[] {
  const lines = text.split('\n')
  const elements: Array<ParsedElement | { type: 'empty' }> = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      elements.push({ type: 'empty' })
      continue
    }

    const sectionMatch = trimmed.match(/^(Diketahui|Ditanyakan|Penyelesaian|Jawab|Kesimpulan)\s*[:.]?\s*$/i)
    if (sectionMatch) {
      elements.push({ type: 'section_header', content: sectionMatch[1] })
      continue
    }

    const numberedMatch = trimmed.match(/^(\d+[.)]\s*|[a-z][.)]\s*)(.+)$/i)
    if (numberedMatch) {
      elements.push({
        type: 'list_item',
        marker: numberedMatch[1].trim(),
        content: numberedMatch[2].trim(),
      })
      continue
    }

    const subItemMatch = trimmed.match(/^[-–]\s+(.+)$/)
    if (subItemMatch) {
      elements.push({
        type: 'sub_item',
        marker: '-',
        content: subItemMatch[1].trim(),
      })
      continue
    }

    elements.push({ type: 'paragraph', content: trimmed })
  }

  const merged: Array<ParsedElement | { type: 'empty' }> = []
  for (const el of elements) {
    const last = merged[merged.length - 1]
    if (el.type === 'paragraph' && last && last.type === 'paragraph') {
      last.content += ' ' + el.content
    } else if (el.type === 'empty') {
      if (last && last.type !== 'empty') {
        merged.push(el)
      }
    } else {
      merged.push(el)
    }
  }

  while (merged.length > 0 && merged[merged.length - 1].type === 'empty') {
    merged.pop()
  }

  return merged.filter((el): el is ParsedElement => el.type !== 'empty')
}

export function buildFormattedTextParagraphs(
  text: string,
  font: FontChoice,
): Paragraph[] {
  const fontName = resolveFontName(font)
  const elements = parseFormattedText(text)
  const paragraphs: Paragraph[] = []

  elements.forEach((el, idx) => {
    if (el.type === 'section_header') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: el.content,
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

    if (el.type === 'list_item') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${el.marker}\t${el.content}`,
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

    if (el.type === 'sub_item') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${el.marker}\t${el.content}`,
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

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: el.content,
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

  return paragraphs
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
