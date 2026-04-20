import Tesseract from 'tesseract.js'

export interface OCRResult {
  text: string
  confidence: number
}

export async function processImageOCR(imageData: string | Blob | File): Promise<OCRResult> {
  let objectUrl: string | null = null;
  let worker: any = null;

  try {
    const Tesseract = (await import('tesseract.js')).default;
    
    let imageSource = imageData;
    if (typeof window !== 'undefined' && typeof imageData !== 'string') {
      objectUrl = URL.createObjectURL(imageData);
      imageSource = objectUrl;
    }

    worker = await Tesseract.createWorker('ind+eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core.wasm.js',
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round((m.progress || 0) * 100)}%`);
        }
      },
    });

    const result = await worker.recognize(imageSource);

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error('OCR processing failed. Please try again or input text manually.');
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.error('Failed to terminate worker', e);
      }
    }
    if (objectUrl && typeof window !== 'undefined') {
      URL.revokeObjectURL(objectUrl);
    }
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