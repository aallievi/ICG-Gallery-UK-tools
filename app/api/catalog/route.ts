import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brands = await db.brand.findMany({
    include: {
      collections: {
        include: { products: { select: { id: true, color: true, stock: true } } },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(brands)
}