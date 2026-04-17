import { Font } from '@react-pdf/renderer'

const DEFAULT_FONT_BASE = '/fonts/'

export function registerFonts(customFontUrl?: string): void {
  const fontBase = customFontUrl || DEFAULT_FONT_BASE
  
  Font.register({
    family: 'Arial',
    fonts: [
      { src: `${fontBase}LiberationSans-Regular.ttf` },
      { src: `${fontBase}LiberationSans-Bold.ttf`, fontWeight: 'bold' },
      { src: `${fontBase}LiberationSans-Italic.ttf`, fontStyle: 'italic' },
      { src: `${fontBase}LiberationSans-BoldItalic.ttf`, fontWeight: 'bold', fontStyle: 'italic' },
    ],
  })
}

export function getFontFamily(): string {
  return 'Arial'
}