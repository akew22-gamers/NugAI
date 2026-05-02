import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export function registerFonts(): void {
  if (fontsRegistered) return
  
  try {
    Font.registerHyphenationCallback((word: string) => [word])
    fontsRegistered = true
  } catch (e) {
    console.error('Font registration error:', e)
  }
}

export function getFontFamily(font?: 'Helvetica' | 'Times-Roman'): string {
  return font || 'Times-Roman'
}