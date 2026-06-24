import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const movements = await db.movement.findMany({
    include: {
      product: { include: { collection: { include: { brand: true } } } },
      client: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { date: 'desc' },
    take: 200,
  })
  return NextResponse.json(movements)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions) as any
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { items, clientName, clientType, project, delivery, status, date, deliveryCost, notes } = body

  // Upsert client
  const client = await db.client.upsert({
    where: { name: clientName },
    update: { type: clientType },
    create: { name: clientName, type: clientType },
  })

  const created = []
  for (const item of items) {
    // Find product
    const product = await db.product.findFirst({
      where: {
        color: item.color,
        collection: { name: item.collection, brand: { name: item.brand } },
      },
    })
    if (!product) continue

    // Update stock
    const delta = ['SENT','DELIVERED'].includes(status) ? -item.qty : status === 'RETURNED' ? item.qty : 0
    if (delta !== 0) {
      await db.product.update({
        where: { id: product.id },
        data: { stock: { increment: delta } },
      })
    }

    const mov = await db.movement.create({
      data: {
        productId: product.id,
        finish: item.finish,
        thickness: item.thickness,
        qty: item.qty,
        clientId: client.id,
        project,
        delivery,
        status,
        userId: session.user.id,
        date: new Date(date),
        deliveryCost: deliveryCost || 0,
        notes,
      },
      include: {
        product: { include: { collection: { include: { brand: true } } } },
        client: true,
        user: { select: { name: true } },
      },
    })
    created.push(mov)
  }

  return NextResponse.json(created)
}
