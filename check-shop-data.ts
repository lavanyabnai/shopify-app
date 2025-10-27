import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkShopData() {
  // Find which shop has order data
  const shops = await prisma.order.groupBy({
    by: ['shop'],
    _count: { id: true },
  });

  console.log('📊 Shops with order data:');
  for (const shop of shops) {
    const orderCount = shop._count.id;
    const inventoryCount = await prisma.inventorySnapshot.count({
      where: { shop: shop.shop },
    });

    console.log(`\n🏪 ${shop.shop}`);
    console.log(`   Orders: ${orderCount}`);
    console.log(`   Inventory Snapshots: ${inventoryCount}`);
  }

  await prisma.$disconnect();
}

checkShopData();
