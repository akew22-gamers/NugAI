import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcryptjs'

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...')

  const DEFAULT_ADMIN_USERNAME = 'admin'
  const DEFAULT_ADMIN_PASSWORD = 'admin123'

  const existingAdmin = await prisma.user.findUnique({
    where: { username: DEFAULT_ADMIN_USERNAME }
  })

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', existingAdmin.username)
  } else {
    const hashedPassword: string = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)

    const adminUser = await prisma.user.create({
      data: {
        username: DEFAULT_ADMIN_USERNAME,
        password: hashedPassword,
        role: 'ADMIN',
        subscription_tier: 'PREMIUM'
      }
    })

    console.log('✅ Admin user created successfully:')
    console.log('   - Username:', adminUser.username)
    console.log('   - Role:', adminUser.role)
    console.log('   - Subscription Tier:', adminUser.subscription_tier)
    console.log('⚠️  WARNING: Please change the default password after first login!')
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