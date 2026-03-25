import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  console.log('🌱 Seeding database...')

  // Users
  const users = [
    { username: 'tom', name: 'Tom', password: 'tom123', role: 'PATRON', color: '#f59e0b' },
    { username: 'noa', name: 'Noa', password: 'noa123', role: 'VENDEUR', color: '#6366f1' },
    { username: 'louis', name: 'Louis', password: 'louis123', role: 'VENDEUR', color: '#10b981' },
    { username: 'esteban', name: 'Estéban', password: 'esteban123', role: 'VENDEUR', color: '#8b5cf6' },
    { username: 'stock', name: 'Logistique', password: 'stock123', role: 'GESTIONNAIRE', color: '#ef4444' },
  ]

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } })
    if (!existing) {
      await prisma.user.create({
        data: { ...u, password: await bcrypt.hash(u.password, 12) },
      })
      console.log(`✅ User: ${u.name}`)
    }
  }

  // Suppliers
  const suppliers = [
    { name: 'Vide-dressing Paris', contact: 'Marie Dupont', email: 'marie@vide-dressing.fr', phone: '06 12 34 56 78' },
    { name: 'Brocante du Marais', contact: 'Jean Martin', phone: '06 87 65 43 21' },
    { name: 'Dépôt Vente Lyon', contact: 'Sophie Bernard', email: 'sophie@depot-lyon.fr' },
  ]

  const createdSuppliers: Array<{ id: string; name: string }> = []
  for (const s of suppliers) {
    const supplier = await prisma.supplier.create({ data: s })
    createdSuppliers.push(supplier)
    console.log(`✅ Supplier: ${s.name}`)
  }

  const tom = await prisma.user.findUnique({ where: { username: 'tom' } })
  const noa = await prisma.user.findUnique({ where: { username: 'noa' } })
  const louis = await prisma.user.findUnique({ where: { username: 'louis' } })
  const esteban = await prisma.user.findUnique({ where: { username: 'esteban' } })

  if (!tom || !noa || !louis || !esteban) throw new Error('Users not found')

  const products = [
    { name: 'Robe fleurie H&M', category: 'Vêtements femme', buyPrice: 3, displayPrice: 15, minPrice: 10, status: 'DISPONIBLE', location: 'Étagère A1', supplierId: createdSuppliers[0].id },
    { name: 'Jean Slim Zara', category: 'Vêtements femme', buyPrice: 5, displayPrice: 18, minPrice: 12, status: 'DISPONIBLE', location: 'Étagère A2', supplierId: createdSuppliers[0].id },
    { name: 'Veste en cuir vintage', category: 'Vêtements homme', buyPrice: 15, displayPrice: 45, minPrice: 30, status: 'RESERVE', sellerId: noa.id, reservedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), location: 'Étagère B1', supplierId: createdSuppliers[1].id },
    { name: 'Sneakers Nike Air Max', category: 'Chaussures', buyPrice: 20, displayPrice: 55, minPrice: 40, status: 'PUBLIE', sellerId: louis.id, publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), location: 'Rayonnage C3' },
    { name: 'Sac à main Longchamp', category: 'Sacs', buyPrice: 25, displayPrice: 80, minPrice: 60, status: 'DISPONIBLE', location: 'Vitrine V1', supplierId: createdSuppliers[2].id },
    { name: 'Manteau camel Mango', category: 'Vêtements femme', buyPrice: 18, displayPrice: 55, minPrice: 40, status: 'A_EXPEDIER', sellerId: noa.id, soldAt: new Date(Date.now() - 24 * 60 * 60 * 1000), location: 'Étagère D2', supplierId: createdSuppliers[0].id },
    { name: 'Chemise Oxford Ralph Lauren', category: 'Vêtements homme', buyPrice: 8, displayPrice: 28, minPrice: 18, status: 'DISPONIBLE', location: 'Étagère B3' },
    { name: 'Robe de soirée Karen Millen', category: 'Vêtements femme', buyPrice: 35, displayPrice: 95, minPrice: 70, status: 'PUBLIE', sellerId: esteban.id, publishedAt: new Date(), hasFlaw: true },
    { name: 'Casquette New Era', category: 'Accessoires', buyPrice: 5, displayPrice: 18, minPrice: 12, status: 'DISPONIBLE', location: 'Bac Z1', supplierId: createdSuppliers[1].id },
    { name: 'Pull Colombien Oversize', category: 'Vêtements femme', buyPrice: 6, displayPrice: 22, minPrice: 15, status: 'RESERVE', sellerId: esteban.id, reservedAt: new Date(), location: 'Étagère A5' },
  ]

  for (const p of products) {
    const product = await prisma.product.create({ data: p })
    console.log(`✅ Product: ${product.name}`)
  }

  const clients = [
    { name: 'Sophie Leblanc', email: 'sophie.leblanc@gmail.com', phone: '06 23 45 67 89' },
    { name: 'Marc Fontaine', email: 'marc.fontaine@hotmail.com' },
    { name: 'Camille Rousseau', phone: '07 12 34 56 78' },
  ]
  const createdClients: Array<{ id: string }> = []
  for (const c of clients) {
    const client = await prisma.client.create({ data: c })
    createdClients.push(client)
    console.log(`✅ Client: ${c.name}`)
  }

  const salesData = [
    { product: 'Manteau camel Mango', sellPrice: 52, seller: noa, clientIdx: 0, platform: 'Vinted', daysAgo: 1 },
    { product: 'Robe fleurie H&M', sellPrice: 14, seller: louis, clientIdx: 1, platform: 'Vinted', daysAgo: 5 },
    { product: 'Jean Slim Zara', sellPrice: 17, seller: noa, clientIdx: 2, platform: 'Vinted', daysAgo: 8 },
    { product: 'Sneakers Nike Air Max', sellPrice: 50, seller: louis, clientIdx: -1, platform: 'Leboncoin', daysAgo: 15 },
    { product: 'Sac à main Longchamp', sellPrice: 75, seller: esteban, clientIdx: 0, platform: 'Vinted', daysAgo: 22 },
    { product: 'Casquette New Era', sellPrice: 16, seller: noa, clientIdx: -1, platform: 'Vinted', daysAgo: 30 },
    { product: 'Chemise Oxford Ralph Lauren', sellPrice: 25, seller: louis, clientIdx: 1, platform: 'Vinted', daysAgo: 45 },
  ]

  let invoiceCounter = 1000
  for (const s of salesData) {
    const buyPrice = s.sellPrice * 0.25
    const { id: productId } = await prisma.product.create({
      data: {
        name: s.product + ' (vendu)',
        buyPrice,
        displayPrice: s.sellPrice,
        minPrice: s.sellPrice * 0.7,
        status: 'VENDU',
        sellPrice: s.sellPrice,
        soldAt: new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000),
        sellerId: s.seller.id,
      },
    })
    const commission = s.sellPrice * 0.25
    await prisma.sale.create({
      data: {
        invoiceNumber: `FAC-2026${String(invoiceCounter++).padStart(4, '0')}`,
        sellPrice: s.sellPrice,
        buyPrice,
        commission,
        profit: s.sellPrice - buyPrice - commission,
        platform: s.platform,
        productId,
        sellerId: s.seller.id,
        clientId: s.clientIdx >= 0 ? createdClients[s.clientIdx].id : undefined,
        date: new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000),
      },
    })
    if (s.clientIdx >= 0) {
      await prisma.client.update({ where: { id: createdClients[s.clientIdx].id }, data: { totalSpent: { increment: s.sellPrice } } })
    }
    console.log(`✅ Sale: ${s.product}`)
  }

  await prisma.setting.upsert({ where: { key: 'commission_rate' }, update: {}, create: { key: 'commission_rate', value: '25' } })
  await prisma.setting.upsert({ where: { key: 'boutique_name' }, update: {}, create: { key: 'boutique_name', value: 'TOM ERP' } })
  await prisma.setting.upsert({ where: { key: 'reservation_duration_hours' }, update: {}, create: { key: 'reservation_duration_hours', value: '24' } })

  await prisma.auditLog.create({
    data: { action: 'SYSTEM_INIT', entity: 'System', details: 'Base de données initialisée', userId: tom.id },
  })

  console.log('\n🎉 Seed terminé avec succès !')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
