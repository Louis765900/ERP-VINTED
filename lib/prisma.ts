import { PrismaClient } from '@/app/generated/prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
