import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del, list, ListBlobResult } from '@vercel/blob'

const CRON_SECRET = process.env.CRON_SECRET
const TEMP_UPLOADS_PREFIX = 'temp-uploads/'

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true
  }
  
  const cronHeader = request.headers.get('x-vercel-protection-bypass')
  if (cronHeader === CRON_SECRET) {
    return true
  }
  
  return false
}

interface VercelBlob {
  url: string
  uploadedAt: Date
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    let blobsDeleted = 0

    try {
      const blobList = await list({
        prefix: TEMP_UPLOADS_PREFIX,
      })

      const blobsToDelete = blobList.blobs.filter((blob: VercelBlob) => {
        return blob.uploadedAt < twentyFourHoursAgo
      })

      for (const blob of blobsToDelete) {
        try {
          await del(blob.url)
          blobsDeleted++
          console.log(`[Cron] Deleted blob: ${blob.url}`)
        } catch (error) {
          console.error(`[Cron] Failed to delete blob ${blob.url}:`, error)
        }
      }

      console.log(`[Cron] Blob cleanup completed: ${blobsDeleted} blobs deleted`)
    } catch (blobError) {
      console.warn('[Cron] Vercel Blob not configured, skipping blob cleanup')
    }

    await prisma.dataPurgeLog.create({
      data: {
        user_id: 'system',
        username_snapshot: 'cron-cleanup',
        sessions_purged: 0,
        items_purged: 0,
        reason: `Temp blob cleanup: ${blobsDeleted} files older than 24h`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Blob cleanup completed',
      blobsDeleted,
    })
  } catch (error) {
    console.error('[Cron] Blob cleanup failed:', error)
    return NextResponse.json(
      { error: 'Blob cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}