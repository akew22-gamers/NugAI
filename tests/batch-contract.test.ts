import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  deduplicateReferences,
  parseBatchResponse,
} from '@/lib/generation/batch-contract'

void describe('parseBatchResponse', () => {
  void it('parses fenced JSON and sorts answers by questionOrder', () => {
    const result = parseBatchResponse(
      '```json\n{"answers":[{"questionOrder":2,"answer":"Jawaban dua"},{"questionOrder":1,"answer":"Jawaban satu"}]}\n```',
      2,
    )
    assert.deepEqual(
      result.map((item) => item.questionOrder),
      [1, 2],
    )
  })

  void it('rejects duplicated questionOrder values', () => {
    assert.throws(() =>
      parseBatchResponse('{"answers":[{"questionOrder":1,"answer":"a"},{"questionOrder":1,"answer":"b"}]}', 2),
    )
  })

  void it('rejects non-JSON responses', () => {
    assert.throws(() => parseBatchResponse('Maaf, tidak ada jawaban.', 1))
  })
})

void describe('deduplicateReferences', () => {
  void it('removes duplicated references by URL', () => {
    const result = deduplicateReferences([
      { title: 'Modul A', url: 'https://contoh.id/a' },
      { title: 'Modul A (salinan)', url: 'https://contoh.id/a' },
      { title: 'Buku B' },
    ])
    assert.equal(result.length, 2)
  })
})
