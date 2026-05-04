import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getPlaceholderImage = (category: string, id: string) => {
    const charCodeSum = (id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    switch(category) {
        case 'ELECTRONICS':
            const electronics = [
                'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80', // laptop
                'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80', // electronics
                'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80', // pc
                'https://images.unsplash.com/photo-1588702545922-e612f02685de?w=600&q=80' // camera
            ];
            return electronics[charCodeSum % electronics.length];
        case 'MOBILES':
            const mobiles = [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', // phone
                'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=600&q=80', // phone
                'https://images.unsplash.com/photo-1533228100845-08145b01de14?w=600&q=80', // phone
                'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80' // phone back
            ];
            return mobiles[charCodeSum % mobiles.length];
        case 'FURNITURE':
            const furniture = [
                'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80', // furniture
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', // sofa
                'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80', // bed
                'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80' // chair
            ];
            return furniture[charCodeSum % furniture.length];
        case 'FASHION':
            const fashion = [
                'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80', // clothes
                'https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600&q=80', // clothes rack
                'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80', // men's fashion
                'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80' // clothing pile
            ];
            return fashion[charCodeSum % fashion.length];
        case 'ACCESSORIES':
            const accessories = [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', // watch
                'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80', // accessories
                'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&q=80', // glasses
                'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80' // watch
            ];
            return accessories[charCodeSum % accessories.length];
        default:
            return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80';
    }
};

async function main() {
    console.log('Fetching products...');
    const products = await prisma.product.findMany();
    
    for (const product of products) {
        const newImageUrl = getPlaceholderImage(product.category, product.id);
        await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: newImageUrl }
        });
        console.log(`Updated ${product.title} to ${newImageUrl}`);
    }
    console.log('All product images updated successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
