import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('=== DATABASE CHECK ===\n');
    
    const users = await prisma.user.count();
    const products = await prisma.product.count();
    const orders = await prisma.order.count();
    const offers = await prisma.offer.count();
    const ratings = await prisma.rating.count();
    const messages = await prisma.message.count();
    
    console.log(`Users: ${users}`);
    console.log(`Products: ${products}`);
    console.log(`Orders: ${orders}`);
    console.log(`Offers: ${offers}`);
    console.log(`Ratings: ${ratings}`);
    console.log(`Messages: ${messages}`);
    
    if (users > 0) {
        const userList = await prisma.user.findMany({ select: { id: true, name: true, email: true, isSeller: true } });
        console.log('\n=== USERS ===');
        userList.forEach(u => console.log(`${u.name} (${u.email}) - Seller: ${u.isSeller}`));
    }
    
    if (products > 0) {
        const productList = await prisma.product.findMany({ 
            select: { id: true, title: true, price: true, category: true, stock: true },
            take: 5 
        });
        console.log('\n=== FIRST 5 PRODUCTS ===');
        productList.forEach(p => console.log(`${p.title} - $${p.price} (Stock: ${p.stock})`));
    }
    
    await prisma.$disconnect();
}

checkDatabase().catch(console.error);
