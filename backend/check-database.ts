import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('========== DATABASE VERIFICATION ==========\n');
    
    try {
        // Check table counts
        const userCount = await prisma.user.count();
        const productCount = await prisma.product.count();
        const orderCount = await prisma.order.count();
        const offerCount = await prisma.offer.count();
        const messageCount = await prisma.message.count();
        const ratingCount = await prisma.rating.count();
        
        console.log('TABLE RECORD COUNTS:');
        console.log(`  Users: ${userCount}`);
        console.log(`  Products: ${productCount}`);
        console.log(`  Orders: ${orderCount}`);
        console.log(`  Offers: ${offerCount}`);
        console.log(`  Messages: ${messageCount}`);
        console.log(`  Ratings: ${ratingCount}\n`);
        
        // Check User data
        if (userCount > 0) {
            console.log('USER DATA SAMPLE (first 5):');
            const users = await prisma.user.findMany({ take: 5, select: { id: true, name: true, email: true, isSeller: true, trustScore: true } });
            users.forEach(u => console.log(`  - ${u.name} (${u.email}) | Seller: ${u.isSeller} | Trust: ${u.trustScore}`));
            console.log();
        }
        
        // Check Product data
        if (productCount > 0) {
            console.log('PRODUCT DATA SAMPLE (first 3):');
            const products = await prisma.product.findMany({ 
                take: 3, 
                include: { seller: { select: { name: true, email: true } } }
            });
            products.forEach(p => console.log(`  - ${p.title} | $${p.price} | Stock: ${p.stock} | Category: ${p.category} | Seller: ${p.seller.name}`));
            console.log();
        }
        
        // Check Order data
        if (orderCount > 0) {
            console.log('ORDER DATA SAMPLE (first 3):');
            const orders = await prisma.order.findMany({ 
                take: 3, 
                include: { product: { select: { title: true } }, buyer: { select: { name: true } } }
            });
            orders.forEach((o: any) => console.log(`  - ${o.product.title} | Buyer: ${o.buyer.name} | Amount: $${o.amount} | Qty: ${o.quantity} | Status: ${o.status}`));
            console.log();
        }
        
        // Check Offer data
        if (offerCount > 0) {
            console.log('OFFER DATA SAMPLE (first 3):');
            const offers = await prisma.offer.findMany({ 
                take: 3, 
                include: { product: { select: { title: true } }, buyer: { select: { name: true } }, seller: { select: { name: true } } }
            });
            offers.forEach((o: any) => console.log(`  - ${o.product.title} | Buyer: ${o.buyer.name} | Seller: ${o.seller.name} | Price: $${o.price} | Status: ${o.status}`));
            console.log();
        }
        
        // Check Message data
        if (messageCount > 0) {
            console.log('MESSAGE DATA SAMPLE (first 3):');
            const messages = await prisma.message.findMany({ 
                take: 3, 
                include: { buyer: { select: { name: true } }, seller: { select: { name: true } }, product: { select: { title: true } } }
            });
            messages.forEach((m: any) => console.log(`  - From: ${m.senderType} | Buyer: ${m.buyer.name} | Seller: ${m.seller.name} | Msg: "${m.content.substring(0, 50)}..."`));
            console.log();
        }
        
        // Check Rating data
        if (ratingCount > 0) {
            console.log('RATING DATA SAMPLE (first 3):');
            const ratings = await prisma.rating.findMany({ 
                take: 3, 
                include: { buyer: { select: { name: true } }, seller: { select: { name: true } } }
            });
            ratings.forEach((r: any) => console.log(`  - Buyer: ${r.buyer.name} | Seller: ${r.seller?.name} | Rating: ${r.rating}/5 | Comment: "${r.comment}"`));
            console.log();
        }
        
        console.log('========== DATABASE CHECK COMPLETE ==========\n');
        
    } catch (error) {
        console.error('ERROR:', error);
    }
    
    await prisma.$disconnect();
}

checkDatabase();
