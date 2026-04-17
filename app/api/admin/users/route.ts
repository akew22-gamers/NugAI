import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole, SubscriptionTier } from '@prisma/client'

async function checkAdminAuth() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tier = searchParams.get('tier')
    const role = searchParams.get('role')

    const where: Record<string, unknown> = { role: 'USER' }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { student_profile: { full_name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (tier && Object.values(SubscriptionTier).includes(tier as SubscriptionTier)) {
      where.subscription_tier = tier
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        role: true,
        subscription_tier: true,
        daily_usage_count: true,
        last_usage_date: true,
        created_at: true,
        student_profile: {
          select: {
            full_name: true,
            nim: true,
            university_name: true,
            study_program: true,
          },
        },
        _count: {
          select: {
            task_sessions: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { username, password, role, subscription_tier, full_name, nim, university_name, faculty, study_program, upbjj_branch } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: 'Username must be 3-50 characters' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const userRole = role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER
    const userTier = subscription_tier === 'PREMIUM' ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: userRole,
        subscription_tier: userTier,
      },
    })

    if (userRole === UserRole.USER && full_name && nim) {
      await prisma.studentProfile.create({
        data: {
          user_id: user.id,
          full_name,
          nim,
          university_name: university_name || '',
          faculty: faculty || '',
          study_program: study_program || '',
          upbjj_branch: upbjj_branch || null,
          university_logo_url: '',
        },
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        subscription_tier: user.subscription_tier,
        created_at: user.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, subscription_tier, password } = body

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (subscription_tier && Object.values(SubscriptionTier).includes(subscription_tier as SubscriptionTier)) {
      updateData.subscription_tier = subscription_tier
    }

    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        subscription_tier: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await checkAdminAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}