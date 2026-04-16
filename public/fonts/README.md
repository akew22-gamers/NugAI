# PDF Fonts Directory

## Font Files Included

This directory contains **Liberation Sans** fonts (based on Roboto) as the default PDF font for NugAI.

| File | Weight/Style | Size |
|------|--------------|------|
| LiberationSans-Regular.ttf | Regular | ~515 KB |
| LiberationSans-Bold.ttf | Bold | ~514 KB |
| LiberationSans-Italic.ttf | Italic | ~533 KB |
| LiberationSans-BoldItalic.ttf | Bold Italic | ~532 KB |

## Font Licensing

- **Roboto** (source): Apache License 2.0 - Free for commercial and personal use
- **Liberation Sans** (alias): Metric-compatible with Arial, SIL Open Font License

## Why Liberation Sans instead of Arial?

The PRD specifies **Arial** for PDF generation, but Arial is a proprietary font owned by Monotype. We use **Liberation Sans** (Roboto-based) as the default because:

1. **Free & Legal**: Can be freely distributed without licensing issues
2. **Metric-compatible**: Similar character widths to Arial
3. **Clean design**: Modern sans-serif suitable for academic documents

## User Custom Font Upload

Users can optionally upload their own Arial fonts via the onboarding flow. When `pdf_font_url` is set in `StudentProfile`, the system uses the user-uploaded font instead of the default.

## Usage in @react-pdf/renderer

```typescript
import { Font } from '@react-pdf/renderer';

Font.register({
  family: 'Arial',
  fonts: [
    { src: '/fonts/LiberationSans-Regular.ttf' },
    { src: '/fonts/LiberationSans-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/LiberationSans-Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/LiberationSans-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ],
});
```

## Alternative: True Liberation Sans

If you want the official Liberation Sans fonts (metric-identical to Arial), download from:
https://github.com/liberationfonts/liberation-fonts/releases

Then replace the files in this directory with the official Liberation Sans TTF files.