/**
 * DOCX unit conversion reference:
 *   font size  = half-points   (24 = 12pt)
 *   margins    = twips         (1440 = 1 inch = 2.54cm)
 *   line space = twips         (276 = 1.15 line height)
 */

export const PAGE_MARGIN_TWIPS = 1440

export const PAGE_MARGINS = {
  top: PAGE_MARGIN_TWIPS,
  right: PAGE_MARGIN_TWIPS,
  bottom: PAGE_MARGIN_TWIPS,
  left: PAGE_MARGIN_TWIPS,
}

export const FONT_SIZE = {
  body: 24,
  heading: 28,
  reference: 22,
}

export const LINE_SPACING = {
  body: 276,
  tight: 240,
  relaxed: 360,
}

export const PARA_SPACING = {
  body: { before: 0, after: 120 },
  listItem: { before: 0, after: 60 },
  subListItem: { before: 0, after: 40 },
  sectionHeader: { before: 160, after: 80 },
  referenceHeader: { before: 400, after: 200 },
  referenceItem: { before: 0, after: 160 },
}

export const INDENT = {
  listItemHanging: 440,
  subListPadding: 440,
  subListHanging: 300,
}

export type FontChoice = 'Helvetica' | 'Times-Roman'

export function resolveFontName(font: FontChoice | undefined): string {
  if (font === 'Helvetica') return 'Arial'
  return 'Times New Roman'
}

export const UT_COVER = {
  logo: { width: 180, height: 180 },
  sectionGap: { before: 240, after: 0 },
  afterLogo: 240,
}

export const UT_IDENTITY_TABLE = {
  labelWidth: 1100,
  separatorWidth: 300,
  valueWidth: 4000,
}
