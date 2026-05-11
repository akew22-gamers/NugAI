import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeightRule,
  ShadingType,
} from 'docx'
import {
  FONT_SIZE,
  LINE_SPACING,
  resolveFontName,
  type FontChoice,
} from './styles'

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' }

const TABLE_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
  insideHorizontal: BORDER,
  insideVertical: BORDER,
}

const CELL_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
}

function docxAlignment(
  alignment: 'left' | 'center' | 'right' | null | undefined,
): (typeof AlignmentType)[keyof typeof AlignmentType] {
  if (alignment === 'center') return AlignmentType.CENTER
  if (alignment === 'right') return AlignmentType.RIGHT
  return AlignmentType.LEFT
}

function buildCellParagraph(
  text: string,
  font: string,
  bold: boolean,
  alignment: 'left' | 'center' | 'right' | null | undefined,
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text || ' ',
        font,
        size: FONT_SIZE.body,
        bold,
      }),
    ],
    alignment: docxAlignment(alignment),
    spacing: { before: 0, after: 0, line: LINE_SPACING.body },
  })
}

function buildHeaderCell(
  text: string,
  font: string,
  alignment: 'left' | 'center' | 'right' | null | undefined,
): TableCell {
  return new TableCell({
    children: [buildCellParagraph(text, font, true, alignment)],
    borders: CELL_BORDERS,
    shading: {
      type: ShadingType.CLEAR,
      color: 'auto',
      fill: 'F4F4F5',
    },
  })
}

function buildBodyCell(
  text: string,
  font: string,
  alignment: 'left' | 'center' | 'right' | null | undefined,
): TableCell {
  return new TableCell({
    children: [buildCellParagraph(text, font, false, alignment)],
    borders: CELL_BORDERS,
  })
}

export interface DocxTableInput {
  headers: string[]
  rows: string[][]
  alignments?: Array<'left' | 'center' | 'right' | null>
}

export function buildDocxTable(
  input: DocxTableInput,
  fontChoice: FontChoice,
): Table {
  const font = resolveFontName(fontChoice)
  const { headers, rows, alignments = [] } = input

  const normalizedRows = rows.map((row) => {
    if (row.length === headers.length) return row
    if (row.length < headers.length) {
      const padded = [...row]
      while (padded.length < headers.length) padded.push('')
      return padded
    }
    return row.slice(0, headers.length)
  })

  const headerRow = new TableRow({
    tableHeader: true,
    height: { value: 400, rule: HeightRule.ATLEAST },
    children: headers.map((h, idx) =>
      buildHeaderCell(h, font, alignments[idx]),
    ),
  })

  const bodyRows = normalizedRows.map(
    (row) =>
      new TableRow({
        height: { value: 400, rule: HeightRule.ATLEAST },
        children: row.map((cell, idx) =>
          buildBodyCell(cell, font, alignments[idx]),
        ),
      }),
  )

  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  })
}
