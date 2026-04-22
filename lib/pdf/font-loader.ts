import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export function registerFonts(): void {
  if (fontsRegistered) return
  
  try {
    Font.registerHyphenationCallback((word: string) => [word])

    Font.register({
      family: 'Helvetica',
      fonts: [
        { src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0bf8pkAg.woff2' },
      ],
    })
    fontsRegistered = true
  } catch (e) {
    console.error('Font registration error:', e)
  }
}

export function getFontFamily(): string {
  return 'Helvetica'
}