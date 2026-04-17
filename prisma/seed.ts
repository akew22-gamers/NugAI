import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcryptjs'

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...')

  // Read admin credentials from environment variables
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (!ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD environment variable is required!')
    console.error('   Set it in .env.local or environment before running seed.')
    process.exit(1)
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME }
  })

  if (existingAdmin) {
    console.log('🔄 Updating existing admin password...')
    const hashedPassword: string = await bcrypt.hash(ADMIN_PASSWORD, 10)
    
    await prisma.user.update({
      where: { username: ADMIN_USERNAME },
      data: {
        password: hashedPassword,
        admin_login_attempts: 0,
        admin_login_locked_until: null
      }
    })
    
    console.log('✅ Admin password updated successfully!')
    console.log('   - Username:', ADMIN_USERNAME)
  } else {
    const hashedPassword: string = await bcrypt.hash(ADMIN_PASSWORD, 10)

    const adminUser = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'ADMIN',
        subscription_tier: 'PREMIUM'
      }
    })

    console.log('✅ Admin user created successfully:')
    console.log('   - Username:', adminUser.username)
    console.log('   - Role:', adminUser.role)
    console.log('   - Subscription Tier:', adminUser.subscription_tier)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e: Error) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })