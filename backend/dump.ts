import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({ take: 5 });
  console.log(products.map(p => ({ id: p.id, title: p.title, imageUrl: p.imageUrl })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
