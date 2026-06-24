import { PrismaClient, Role, Status } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const BRANDS = [
  {
    name: 'Ariostea',
    color: '#b8936a',
    collections: [
      { name: 'Ultra Marmi', finishes: ['Lux','Natural Plus','Cashmere','Silk'], thickness: [6], colors: ['Bianco Statuario','Bianco Calacatta','Calacatta Macchia Vecchia','Calacatta Lincoln','Calacatta Viola','Calacatta Dorato','Arabescato Statuario','Bianco Carrara','Rosso Imperiale','Brown Fusion','Onice Pesca','Travertino Romano','Travertino Silver','Travertino Titanio','Collemandina','Silver Wave'] },
      { name: 'Ultra Pietre', finishes: ['Natural Plus','Prelucidato','Silk'], thickness: [6], colors: ['Portland Greige','Cremo Italia','Luna Limestone','Crema Luna','Pietra Grey'] },
      { name: 'Marmi Classici', finishes: ['Polished','Natural','Natural Plus'], thickness: [8], colors: ['Bianco Calacatta','Bianco Covelano','Statuario Classico','Arabescato Classico','Calacatta Lincoln','Nero Marquinia','Pulpis Grey','Thassos','Fior di Bosco'] },
      { name: 'Balance', finishes: ['Natural Plus','Natural'], thickness: [8], colors: ['Azure','Chester Green','Dark Grey','Ivory','Light Grey','Marsala Red','Mud','Nude','Ochre','Orange','Steel Blue','Tan','Umber'] },
      { name: 'Next', finishes: ['Natural','Antislip'], thickness: [8,20], colors: ['Next Brick','Next Chalk','Next Crete','Next Dark','Next Greige','Next Grey'] },
      { name: 'Elementae', finishes: ['Natural','Structured'], thickness: [10], colors: ['Aere','Labi','Pluvia','Sabula'] },
      { name: 'Fragmenta Full Body', finishes: ['Natural','Soft','Polished'], thickness: [10], colors: ['Bianco','Beige','Grigio','Nero','Arlecchino','Botticino Dorato'] },
    ]
  },
  {
    name: 'Iris FMG',
    color: '#6b8e6b',
    collections: [
      { name: 'Maxfine Marmi', finishes: ['Polished','Jewel','Top Lapped','Glint','Natural','Lapped'], thickness: [6], colors: ['White Calacatta','Aosta Green Marble','Black Marquina','Arabescato','Vogue','Gem Rose','Gem Pearl','Ocean Storm','Verde Persia','Onice Malaga','Crema Avorio','Pallisandro Blu','Calacatta Oro','Breccia Imperiale'] },
      { name: 'Maximum Marmi', finishes: ['Natural Plus','Polished','Lapped'], thickness: [6], colors: ['Pietra Grey','Breccia Imperiale','Glam Bronze','Pietra di Luna','Calacatta'] },
      { name: 'Venice Villa', finishes: ['Natural Plus','Polished','Lapped'], thickness: [10], colors: ['Silver','Grey','Ivory','Zinc','White'] },
      { name: 'Marble Lab', finishes: ['Natural','Natural Plus','Polished','Top Lapped'], thickness: [8], colors: ['Premium White','Platinum White','Alaska White','Dark Marquina'] },
      { name: 'Victorian Stone', finishes: ['Natural Plus','Structured','Antislip'], thickness: [8], colors: ['Moon Cream','Silver','Greige','Tobacco','Ivory'] },
      { name: 'Balance FMG', finishes: ['Natural Plus'], thickness: [6,8], colors: ['Azure','Chester Green','Ivory','Light Grey','Marsala Red','Mud','Nude','Ochre','Orange'] },
    ]
  },
  {
    name: 'Sapienstone',
    color: '#cc7a7a',
    collections: [
      { name: 'Marmi Sapienstone', finishes: ['Polished','Natural','Cashmere','Levigato','Silky'], thickness: [12,20], colors: ['Calacatta','Calacatta 4D','Calacatta Aureo 4D','Calacatta Macchia Vecchia 4D','White Calacatta','Arabescato','Dark Marquina','Bianco Lasa','Fior di Bosco','Breccia Imperiale','Bright Onyx','Silver Wave 4D'] },
      { name: 'Royal Stone', finishes: ['Natural','Polished'], thickness: [12], colors: ['Black Diamond','Palladium Grey','Platinum White'] },
      { name: 'Pietre Sapienstone', finishes: ['Natural','Structured','Cashmere'], thickness: [12], colors: ['Luna Limestone','Pietra Grey','Quarzite Vals','Ceppo Varese','Piasentina'] },
      { name: 'Taj Mahal & Speciali', finishes: ['Cashmere','Polished','Natural'], thickness: [12,20], colors: ['Taj Mahal','Alaska White','Crema Avorio','Crema Neve','Premium White','Alpi Chiaro'] },
    ]
  },
  {
    name: 'Fiandre',
    color: '#7a9ecc',
    collections: [
      { name: 'Con.Crea', finishes: ['Natural Plus','Silk'], thickness: [8], colors: ['Cloud','Piombo','Sand','Perla','Taupe'] },
      { name: 'Royal Stone', finishes: ['Natural Plus','Polished'], thickness: [8], colors: ['Black Diamond','Palladium Grey','Platinum White'] },
      { name: 'Great Royal Stone', finishes: ['Natural Plus','Polished'], thickness: [6], colors: ['Platinum White','Palladium Grey','Black Diamond','Silver','Ivory'] },
      { name: 'Mura', finishes: ['Natural','Natural Plus','Antislip'], thickness: [6,8,20], colors: ['Lunara','Sankira','Ramira'] },
      { name: 'Soft Concrete', finishes: ['Natural','Silk'], thickness: [8], colors: ['Bianco','Grigio','Antracite','Beige','Sand'] },
    ]
  },
  {
    name: 'Porcelaingres',
    color: '#8e8e6b',
    collections: [
      { name: 'Royal Stone', finishes: ['Natural Plus','Polished','Bright'], thickness: [6,8], colors: ['Black Diamond','Palladium Grey','Platinum White','Silver','Tobacco','Ivory'] },
      { name: 'Great Royal Stone', finishes: ['Natural Plus','Bright','Polished'], thickness: [6], colors: ['Platinum White','Palladium Grey','Black Diamond','Moonstone','Silver'] },
      { name: 'Loft', finishes: ['Natural','Structured'], thickness: [6,8,20], colors: ['Snow','Sand','Smoke','Dark'] },
      { name: 'Urban', finishes: ['Natural','Structured'], thickness: [8,20], colors: ['Snow','Graphite','Taupe','Sand','Bone','Anthracite'] },
      { name: 'Eternal Stone', finishes: ['Natural','Polished','Structured'], thickness: [6,8], colors: ['Bianco','Grigio Chiaro','Greige','Grigio','Antracite','Beige'] },
      { name: 'Stardust', finishes: ['Natural','Silk'], thickness: [8], colors: ['Clay','Sand','Ivory','Ash'] },
    ]
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Users
  const adminPw = await bcrypt.hash('admin123', 10)
  const teamPw = await bcrypt.hash('icg2026', 10)
  const viewPw = await bcrypt.hash('viewer123', 10)

  const admin = await prisma.user.upsert({ where: { email: 'admin@icg.com' }, update: {}, create: { email: 'admin@icg.com', password: adminPw, name: 'Admin', role: Role.ADMIN } })
  const ricco = await prisma.user.upsert({ where: { email: 'ricco@icg.com' }, update: {}, create: { email: 'ricco@icg.com', password: teamPw, name: 'Ricco', role: Role.TEAM_MEMBER } })
  const sghedoni = await prisma.user.upsert({ where: { email: 'sghedoni@icg.com' }, update: {}, create: { email: 'sghedoni@icg.com', password: teamPw, name: 'Sghedoni', role: Role.TEAM_MEMBER } })
  const allievi = await prisma.user.upsert({ where: { email: 'allievi@icg.com' }, update: {}, create: { email: 'allievi@icg.com', password: teamPw, name: 'Allievi', role: Role.TEAM_MEMBER } })
  await prisma.user.upsert({ where: { email: 'viewer@icg.com' }, update: {}, create: { email: 'viewer@icg.com', password: viewPw, name: 'Viewer', role: Role.VIEWER } })

  // Brands, Collections, Products
  const productMap: Record<string, string> = {}
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({ where: { name: b.name }, update: { color: b.color }, create: { name: b.name, color: b.color } })
    for (const c of b.collections) {
      let coll
      try {
        coll = await prisma.collection.upsert({ where: { name_brandId: { name: c.name, brandId: brand.id } }, update: { finishes: c.finishes, thickness: c.thickness }, create: { name: c.name, brandId: brand.id, finishes: c.finishes, thickness: c.thickness } })
      } catch { continue }
      for (const color of c.colors) {
        try {
          const prod = await prisma.product.upsert({ where: { color_collectionId: { color, collectionId: coll.id } }, update: {}, create: { color, collectionId: coll.id, stock: Math.floor(Math.random() * 8) + 3 } })
          productMap[`${b.name}|${c.name}|${color}`] = prod.id
        } catch { continue }
      }
    }
  }

  // Clients
  const clientNames = ['Trimline','Mudrak','Esher Bathroom','Gansler','Zulufish','Tile Centre','Floresco','Solus','Claybroke','Parkside','Studio Milo','EA Designers','Gerald Culliford','Endara','Federica','Jamie','Carbogno Architects','Tapis & Co']
  const clientMap: Record<string, string> = {}
  for (const name of clientNames) {
    const c = await prisma.client.upsert({ where: { name }, update: {}, create: { name, type: ['Distributor','Architects','Interior Designer','ICG Team','Private Client'][Math.floor(Math.random()*5)] } })
    clientMap[name] = c.id
  }

  // Demo movements
  const demos = [
    { pk: 'Ariostea|Ultra Marmi|Calacatta Lincoln', finish: 'Lux', mm: 6, qty: 2, client: 'Endara', status: Status.SENT, user: ricco.id, date: new Date('2026-01-15'), cost: 10.90 },
    { pk: 'Iris FMG|Maxfine Marmi|Arabescato', finish: 'Polished', mm: 6, qty: 1, client: 'Trimline', status: Status.DELIVERED, user: sghedoni.id, date: new Date('2026-01-20'), cost: 0 },
    { pk: 'Sapienstone|Pietre Sapienstone|Luna Limestone', finish: 'Cashmere', mm: 12, qty: 1, client: 'Gansler', status: Status.DELIVERED, user: allievi.id, date: new Date('2026-01-22'), cost: 0, project: 'Foster & Partners' },
    { pk: 'Iris FMG|Marble Lab|Premium White', finish: 'Natural', mm: 8, qty: 3, client: 'Esher Bathroom', status: Status.SENT, user: ricco.id, date: new Date('2026-02-03'), cost: 5.45 },
    { pk: 'Ariostea|Ultra Marmi|Calacatta Viola', finish: 'Lux', mm: 6, qty: 2, client: 'Gerald Culliford', status: Status.SENT, user: sghedoni.id, date: new Date('2026-02-14'), cost: 5.45 },
    { pk: 'Sapienstone|Taj Mahal & Speciali|Taj Mahal', finish: 'Cashmere', mm: 12, qty: 2, client: 'Studio Milo', status: Status.DELIVERED, user: ricco.id, date: new Date('2026-03-05'), cost: 8.50, project: 'Residential Chelsea' },
    { pk: 'Ariostea|Balance|Chester Green', finish: 'Natural Plus', mm: 8, qty: 1, client: 'Mudrak', status: Status.LOST, user: allievi.id, date: new Date('2026-03-12'), cost: 0, notes: 'Non trovato in magazzino' },
    { pk: 'Sapienstone|Marmi Sapienstone|Calacatta Aureo 4D', finish: 'Polished', mm: 12, qty: 2, client: 'Carbogno Architects', status: Status.SENT, user: ricco.id, date: new Date('2026-05-07'), cost: 10.90 },
    { pk: 'Iris FMG|Victorian Stone|Moon Cream', finish: 'Structured', mm: 8, qty: 4, client: 'EA Designers', status: Status.DELIVERED, user: allievi.id, date: new Date('2026-05-20'), cost: 8.50, project: 'Mayfair Hotel' },
    { pk: 'Ariostea|Ultra Marmi|Travertino Romano', finish: 'Lux', mm: 6, qty: 2, client: 'Tile Centre', status: Status.SENT, user: sghedoni.id, date: new Date('2026-06-10'), cost: 5.45 },
  ]

  for (const d of demos) {
    const pid = productMap[d.pk]
    const cid = clientMap[d.client]
    if (!pid || !cid) continue
    await prisma.movement.create({ data: { productId: pid, finish: d.finish, thickness: d.mm, qty: d.qty, clientId: cid, status: d.status, userId: d.user, date: d.date, deliveryCost: d.cost, project: d.project, notes: d.notes } })
  }

  console.log('✅ Done!')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
