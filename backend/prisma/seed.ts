import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@reusemart.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

async function main() {
    console.log('Clearing existing marketplace data...');

    await prisma.order.deleteMany();
    await prisma.message.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
        data: {
            name: adminName,
            email: adminEmail,
            password: passwordHash,
            role: 'ADMIN',
            isSeller: false,
            activeMode: 'BUYER',
        },
    });

    console.log('✓ Admin account created.');

    // Create realistic sellers
    const sellers = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Rahul Kumar',
                email: 'rahul@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 85,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Priya Sharma',
                email: 'priya@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 92,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Amit Patel',
                email: 'amit@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 78,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Neha Singh',
                email: 'neha@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 88,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Vikram Desai',
                email: 'vikram@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 82,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Anjali Verma',
                email: 'anjali@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 90,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Rohan Gupta',
                email: 'rohan@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: true,
                userType: 'SELLER',
                activeMode: 'SELLER',
                trustScore: 75,
            },
        }),
    ]);

    console.log(`✓ Created ${sellers.length} seller accounts`);

    // Create realistic buyers
    const buyers = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Aisha Khan',
                email: 'aisha@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: false,
                userType: 'BUYER',
                activeMode: 'BUYER',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Siddharth Nair',
                email: 'siddharth@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: false,
                userType: 'BUYER',
                activeMode: 'BUYER',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Divya Reddy',
                email: 'divya@example.com',
                password: await bcrypt.hash('Password123', 12),
                isSeller: false,
                userType: 'BUYER',
                activeMode: 'BUYER',
            },
        }),
    ]);

    console.log(`✓ Created ${buyers.length} buyer accounts`);

    // Product data with different categories
    const products: Array<{
        title: string;
        description: string;
        price: number;
        stock: number;
        usageYears: number;
        category: 'ELECTRONICS' | 'MOBILES' | 'FURNITURE' | 'FASHION' | 'ACCESSORIES';
        condition: 'LIKE_NEW' | 'USED' | 'OLD' | 'TOO_OLD';
        conditionDetails: string[];
        sellerId: string;
    }> = [
        // ELECTRONICS (8 products)
        {
            title: 'Dell Inspiron 15 Laptop',
            description: 'Intel i5 10th Gen ◆ 8GB RAM ◆ 512GB SSD ◆ Mint condition ◆ Comes with charger',
            price: 35000,
            stock: 5,
            usageYears: 2,
            category: 'ELECTRONICS',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Comes with original charger', 'Screen in perfect condition', 'No visible scratches'],
            sellerId: sellers[0].id,
        },
        {
            title: 'Sony Bravia 55" 4K TV',
            description: '4K Ultra HD ◆ HDR support ◆ Android Smart TV ◆ Excellent picture quality ◆ Minor scratches on bezel',
            price: 28000,
            stock: 3,
            usageYears: 3,
            category: 'ELECTRONICS',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Remote included', 'Slight bezel scratches', 'Wall mount compatible'],
            sellerId: sellers[1].id,
        },
        {
            title: 'Canon EOS 1500D DSLR Camera',
            description: '24MP sensor ◆ Full HD video ◆ 18-55mm lens included ◆ Photography ready',
            price: 22000,
            stock: 2,
            usageYears: 1,
            category: 'ELECTRONICS',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Comes with original box', 'Extra battery included', 'Shutter count under 5000'],
            sellerId: sellers[2].id,
        },
        {
            title: 'LG Washing Machine 7kg',
            description: 'Front load ◆ Fuzzy Logic technology ◆ Decent condition ◆ Working perfectly',
            price: 18000,
            stock: 1,
            usageYears: 4,
            category: 'ELECTRONICS',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Minor rust on exterior', 'All cycles working'],
            sellerId: sellers[3].id,
        },
        {
            title: 'Lenovo ThinkPad Tablet',
            description: '8-inch display ◆ Snapdragon processor ◆ 4GB RAM ◆ Great for reading',
            price: 12000,
            stock: 4,
            usageYears: 2,
            category: 'ELECTRONICS',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Charger included', 'Screen protector on'],
            sellerId: sellers[0].id,
        },
        {
            title: 'Bose Quiet Comfort Headphones',
            description: 'Noise-cancelling ◆ Premium sound ◆ Wireless ◆ Like new condition',
            price: 15000,
            stock: 3,
            usageYears: 1,
            category: 'ELECTRONICS',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Comes with original box', 'All accessories included'],
            sellerId: sellers[1].id,
        },
        {
            title: 'Air Fryer 4.5L',
            description: 'Digital controls ◆ 1500W ◆ Multiple preset modes ◆ Excellent condition',
            price: 8500,
            stock: 6,
            usageYears: 0,
            category: 'ELECTRONICS',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Comes with original box', 'Never used commercially'],
            sellerId: sellers[4].id,
        },
        {
            title: 'Power Bank 30000mAh',
            description: 'Fast charging support ◆ Multiple ports ◆ Lightweight ◆ Reliable',
            price: 3500,
            stock: 10,
            usageYears: 1,
            category: 'ELECTRONICS',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Original cable included', 'Battery holds charge well'],
            sellerId: sellers[5].id,
        },
        // MOBILES (8 products)
        {
            title: 'iPhone 12 64GB Space Gray',
            description: 'A14 Bionic chip ◆ Dual camera setup ◆ 5G ready ◆ Cracked screen (repairable)',
            price: 42000,
            stock: 2,
            usageYears: 2,
            category: 'MOBILES',
            condition: 'USED',
            conditionDetails: ['Screen has crack', 'Battery health 75%', 'Works perfectly', 'Original charger not included'],
            sellerId: sellers[2].id,
        },
        {
            title: 'Samsung Galaxy S21 5G 256GB',
            description: 'Snapdragon 888 ◆ 120Hz display ◆ 64MP telephoto ◆ Excellent condition',
            price: 48000,
            stock: 1,
            usageYears: 1,
            category: 'MOBILES',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Original charger included', 'No scratches or dents', 'Battery health 95%'],
            sellerId: sellers[3].id,
        },
        {
            title: 'OnePlus 9 Pro 256GB',
            description: 'Snapdragon 888 ◆ 120Hz AMOLED ◆ 48MP Hasselblad camera ◆ Mint',
            price: 38000,
            stock: 3,
            usageYears: 1,
            category: 'MOBILES',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Comes with original box', 'Charger included', 'Screen protector applied'],
            sellerId: sellers[0].id,
        },
        {
            title: 'Redmi Note 10 Pro 128GB',
            description: 'Snapdragon 732G ◆ 120Hz display ◆ 108MP camera ◆ Good value',
            price: 18000,
            stock: 5,
            usageYears: 2,
            category: 'MOBILES',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Minor scratches on sides', 'Battery health good'],
            sellerId: sellers[1].id,
        },
        {
            title: 'Google Pixel 5a 128GB',
            description: 'Snapdragon 765G ◆ Pixel camera magic ◆ Stock Android ◆ Water resistant',
            price: 32000,
            stock: 2,
            usageYears: 1,
            category: 'MOBILES',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Original packaging intact', 'All accessories included'],
            sellerId: sellers[4].id,
        },
        {
            title: 'Mi 11 Lite 128GB',
            description: 'Snapdragon 732G ◆ AMOLED display ◆ Lightweight design ◆ Great battery',
            price: 22000,
            stock: 4,
            usageYears: 1,
            category: 'MOBILES',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Charger included', 'Minor edge wear'],
            sellerId: sellers[5].id,
        },
        {
            title: 'iPhone 11 128GB Purple',
            description: 'A13 Bionic ◆ Dual camera ◆ Good battery life ◆ Light usage',
            price: 35000,
            stock: 2,
            usageYears: 2,
            category: 'MOBILES',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Battery health 82%', 'Minor scratches on back glass'],
            sellerId: sellers[6].id,
        },
        {
            title: 'Samsung Galaxy A52 128GB',
            description: 'Snapdragon 720G ◆ 90Hz display ◆ 64MP camera ◆ Great midrange phone',
            price: 24000,
            stock: 3,
            usageYears: 1,
            category: 'MOBILES',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Comes with original charger', 'Screen protector included'],
            sellerId: sellers[0].id,
        },
        // FURNITURE (6 products)
        {
            title: 'Wooden Dining Table 6-seater',
            description: 'Solid oak wood ◆ Good finish ◆ Spacious tabletop ◆ Slight wear marks',
            price: 18000,
            stock: 1,
            usageYears: 5,
            category: 'FURNITURE',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Minor surface scratches', 'Chairs not included'],
            sellerId: sellers[1].id,
        },
        {
            title: 'Leather Office Chair',
            description: 'Comfortable mesh back ◆ Adjustable height ◆ Wheels included ◆ Good condition',
            price: 12000,
            stock: 2,
            usageYears: 3,
            category: 'FURNITURE',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Minor wear on seat', 'All parts working smoothly'],
            sellerId: sellers[2].id,
        },
        {
            title: 'Bookshelf Wooden 5-tier',
            description: 'Compact storage ◆ Dark finish ◆ Sturdy design ◆ Perfect for bedroom',
            price: 8000,
            stock: 3,
            usageYears: 2,
            category: 'FURNITURE',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Light scratches on shelves', 'Screws included'],
            sellerId: sellers[3].id,
        },
        {
            title: 'Bed Frame Queen Size',
            description: 'Metal frame ◆ Strong support ◆ Easy assembly ◆ Modern design',
            price: 15000,
            stock: 1,
            usageYears: 2,
            category: 'FURNITURE',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'All hardware included', 'Mattress not included'],
            sellerId: sellers[4].id,
        },
        {
            title: 'Coffee Table Glass Top',
            description: 'Modern design ◆ Glass top ◆ Metal frame ◆ Excellent condition',
            price: 6500,
            stock: 2,
            usageYears: 1,
            category: 'FURNITURE',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'No scratches on glass', 'Very stylish'],
            sellerId: sellers[5].id,
        },
        {
            title: 'Wardrobe 3-door',
            description: 'Spacious closet ◆ Mirror on door ◆ Good finish ◆ Multiple shelves',
            price: 22000,
            stock: 1,
            usageYears: 3,
            category: 'FURNITURE',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'One door hinge loose', 'Mirror intact'],
            sellerId: sellers[0].id,
        },
        // FASHION (4 products)
        {
            title: 'Branded Winter Jacket',
            description: 'Columbia brand ◆ Waterproof ◆ Insulated ◆ Size M ◆ Good condition',
            price: 5500,
            stock: 2,
            usageYears: 2,
            category: 'FASHION',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'No tears or stains', 'All zippers working'],
            sellerId: sellers[1].id,
        },
        {
            title: 'Leather Crossbody Bag',
            description: 'Genuine leather ◆ Brown color ◆ Spacious ◆ Travel ready',
            price: 4500,
            stock: 3,
            usageYears: 1,
            category: 'FASHION',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'No scuffs or wear', 'All hardware intact'],
            sellerId: sellers[2].id,
        },
        {
            title: 'Sports Running Shoes Size 10',
            description: 'Nike brand ◆ Lightly worn ◆ Comfortable ◆ Good traction',
            price: 3500,
            stock: 4,
            usageYears: 1,
            category: 'FASHION',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Sole in good condition', 'Original box included'],
            sellerId: sellers[3].id,
        },
        {
            title: 'Designer Sunglasses',
            description: 'Ray-Ban style ◆ UV protection ◆ Original case ◆ Mint condition',
            price: 2800,
            stock: 5,
            usageYears: 0,
            category: 'FASHION',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Never worn', 'Original case and cloth included'],
            sellerId: sellers[4].id,
        },
        // ACCESSORIES (4 products)
        {
            title: 'Smartwatch Fitbit Charge 4',
            description: 'Heart rate monitor ◆ GPS enabled ◆ Water resistant ◆ Good battery',
            price: 11000,
            stock: 2,
            usageYears: 1,
            category: 'ACCESSORIES',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Charger included', 'Minor scratches on screen'],
            sellerId: sellers[5].id,
        },
        {
            title: 'Portable Bluetooth Speaker',
            description: 'JBL Flip 5 ◆ Waterproof ◆ 12-hour battery ◆ Great sound quality',
            price: 7500,
            stock: 3,
            usageYears: 1,
            category: 'ACCESSORIES',
            condition: 'USED',
            conditionDetails: ['Fully functional and working', 'Charging cable included', 'Sound quality excellent'],
            sellerId: sellers[0].id,
        },
        {
            title: 'USB-C Hub Adapter',
            description: 'Multiple ports ◆ Aluminum build ◆ Compatible with laptops ◆ Compact',
            price: 2000,
            stock: 8,
            usageYears: 0,
            category: 'ACCESSORIES',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Original packaging intact', 'All drivers included'],
            sellerId: sellers[1].id,
        },
        {
            title: 'Phone Stand for Desk',
            description: 'Adjustable angle ◆ Aluminum ◆ Non-slip base ◆ Minimalist design',
            price: 1200,
            stock: 12,
            usageYears: 0,
            category: 'ACCESSORIES',
            condition: 'LIKE_NEW',
            conditionDetails: ['Fully functional and working', 'Perfect for video calls', 'Light weight portable'],
            sellerId: sellers[2].id,
        },
    ];

    // Create all products (without conditionDetails for now - will add after migration)
    const createdProducts = await Promise.all(
        products.map((product) =>
            prisma.product.create({
                data: {
                    title: product.title,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    usageYears: product.usageYears,
                    category: product.category,
                    condition: product.condition,
                    sellerId: product.sellerId,
                    imageUrl: 'https://placehold.co/600x400/E5E7EB/9CA3AF?text=' + encodeURIComponent(product.title),
                },
            })
        )
    );

    console.log(`✓ Created ${createdProducts.length} products across all categories`);

    // Print summary
    console.log('\n========== SEED DATA CREATED ==========');
    console.log(`\nAdmin Account:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`\nSeller Accounts (use these to login and create listings):`);
    sellers.forEach((seller, i) => {
        console.log(`  ${i + 1}. ${seller.name} (${seller.email}) - Trust Score: ${seller.trustScore}`);
    });
    console.log(`\nBuyer Accounts (use these to shop):`);
    buyers.forEach((buyer, i) => {
        console.log(`  ${i + 1}. ${buyer.name} (${buyer.email})`);
    });
    console.log(`\nProducts Created:`);
    console.log(`  - Total: 30 products`);
    console.log(`  - Electronics: 8`);
    console.log(`  - Mobiles: 8`);
    console.log(`  - Furniture: 6`);
    console.log(`  - Fashion: 4`);
    console.log(`  - Accessories: 4`);
    console.log('\n======================================\n');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
