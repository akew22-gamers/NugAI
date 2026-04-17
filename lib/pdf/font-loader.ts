import { Font } from '@react-pdf/renderer'

export function registerFonts(): void {
  try {
    Font.register({
      family: 'Roboto',
      fonts: [
        {
          src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.woff2',
          fontWeight: 400,
        },
        {
          src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfCRc4EsA.woff2',
          fontWeight: 700,
        },
      ],
    })
  } catch (e) {
    console.error('Font registration failed, will fallback:', e)
  }
}

export function getFontFamily(): string {
  return 'Roboto'
}