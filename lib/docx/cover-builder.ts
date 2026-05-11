import {
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
} from 'docx'
import { UT_LOGO_BASE64 } from '@/lib/pdf/ut-logo'
import {
  FONT_SIZE,
  LINE_SPACING,
  UT_COVER,
  UT_IDENTITY_TABLE,
  resolveFontName,
  type FontChoice,
} from './styles'

interface CoverData {
  sessionNumber?: number
  courseName: string
  courseCode?: string | null
  tutorName: string
  studentName: string
  studentNim: string
  studyProgram: string
  faculty: string
  upbjjBranch?: string
  fontFamily?: FontChoice
}

function centeredBold(
  text: string,
  font: string,
  size: number,
  spacingAfter = 40,
): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font, size })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: spacingAfter, line: LINE_SPACING.body },
  })
}

function emptyParagraph(spacingAfter = 0): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 0, after: spacingAfter },
  })
}

function decodeBase64Logo(): Buffer {
  const base64Data = UT_LOGO_BASE64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

function buildLogoParagraph(): Paragraph {
  const logoBuffer = decodeBase64Logo()
  return new Paragraph({
    children: [
      new ImageRun({
        type: 'png',
        data: logoBuffer,
        transformation: {
          width: UT_COVER.logo.width,
          height: UT_COVER.logo.height,
        },
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: UT_COVER.sectionGap.before, after: UT_COVER.afterLogo },
  })
}

function buildIdentityTable(
  studentName: string,
  studentNim: string,
  font: string,
): Table {
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  }

  const makeCell = (text: string, width: number, bold = true) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, bold, font, size: FONT_SIZE.body }),
          ],
          spacing: { before: 0, after: 0, line: LINE_SPACING.body },
        }),
      ],
      width: { size: width, type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders: noBorders,
    })

  const row = (label: string, value: string) =>
    new TableRow({
      children: [
        makeCell(label, UT_IDENTITY_TABLE.labelWidth),
        makeCell(':', UT_IDENTITY_TABLE.separatorWidth),
        makeCell(value.toUpperCase(), UT_IDENTITY_TABLE.valueWidth),
      ],
    })

  return new Table({
    rows: [row('NAMA', studentName), row('NIM', studentNim)],
    width: { size: 60, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
  })
}

export function buildUTCoverChildren(
  data: CoverData,
): Array<Paragraph | Table> {
  const font = resolveFontName(data.fontFamily)
  const sessionNumber = data.sessionNumber || 1
  const courseLabel = data.courseCode
    ? `${data.courseName.toUpperCase()} (${data.courseCode})`
    : data.courseName.toUpperCase()

  const children: Array<Paragraph | Table> = []

  children.push(
    centeredBold(
      `TUGAS TUTORIAL SESI ${sessionNumber}`,
      font,
      FONT_SIZE.heading,
      40,
    ),
  )
  children.push(centeredBold('MATA KULIAH', font, FONT_SIZE.heading, 40))
  children.push(centeredBold(courseLabel, font, FONT_SIZE.heading, 200))

  children.push(buildLogoParagraph())

  children.push(centeredBold('TUTOR PEMBIMBING', font, FONT_SIZE.body, 40))
  children.push(
    centeredBold(data.tutorName, font, FONT_SIZE.body, 240),
  )

  children.push(centeredBold('DISUSUN OLEH', font, FONT_SIZE.body, 120))
  children.push(buildIdentityTable(data.studentName, data.studentNim, font))

  children.push(emptyParagraph(400))

  children.push(
    centeredBold(
      `PROGRAM STUDI ${data.studyProgram.toUpperCase()}`,
      font,
      FONT_SIZE.heading,
      40,
    ),
  )
  children.push(
    centeredBold(
      `FAKULTAS ${data.faculty.toUpperCase()}`,
      font,
      FONT_SIZE.heading,
      40,
    ),
  )
  if (data.upbjjBranch) {
    children.push(
      centeredBold(
        `UPBJJ UT ${data.upbjjBranch.toUpperCase()}`,
        font,
        FONT_SIZE.heading,
        40,
      ),
    )
  }
  children.push(
    centeredBold('UNIVERSITAS TERBUKA', font, FONT_SIZE.heading, 40),
  )

  return children
}
