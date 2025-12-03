import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test connection on startup với retry logic
async function connectWithRetry(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Connected to database successfully')
      return
    } catch (error: any) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error.message)
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        console.error('❌ Failed to connect to database after all retries')
        console.error('Please check:')
        console.error('1. DATABASE_URL in .env file is correct')
        console.error('2. MongoDB Atlas cluster is running and accessible')
        console.error('3. Your IP address is whitelisted in MongoDB Atlas Network Access')
        console.error('4. Connection string format is correct (should include ?retryWrites=true&w=majority)')
        throw error
      }
    }
  }
}

// Chỉ test connection trong development, production sẽ connect khi cần
if (process.env.NODE_ENV === 'development') {
  connectWithRetry().catch((error) => {
    console.error('Database connection warning (app may still work):', error.message)
  })
}

