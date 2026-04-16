import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
}

export async function processImageOCR(imageData: string | Blob | File): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(imageData, 'ind+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence,
    }
  } catch (error) {
    console.error('OCR processing failed:', error)
    throw new Error('OCR processing failed. Please try again or input text manually.')
  }
}

export async function processMultipleImages(images: Array<string | Blob | File>): Promise<OCRResult[]> {
  const results = await Promise.all(images.map((img) => processImageOCR(img)))
  return results
}

export function combineOCRResults(results: OCRResult[]): string {
  return results
    .map((r) => r.text)
    .filter((text) => text.length > 0)
    .join('\n\n')
}

export function validateOCRResult(result: OCRResult): boolean {
  return result.confidence > 50 && result.text.length > 10
}

export async function processImageWithRetry(
  imageData: string | Blob | File,
  maxRetries: number = 1
): Promise<OCRResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await processImageOCR(imageData)
      if (validateOCRResult(result)) {
        return result
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown OCR error')
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  throw lastError || new Error('OCR result quality too low. Please input text manually.')
}