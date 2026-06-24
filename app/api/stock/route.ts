import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await db.product.findMany({
    include: { collection: { include: { brand: true } } },
    orderBy: { stock: 'asc' },
  })
  return NextResponse.json(products)
}