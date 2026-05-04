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

    console.log('✓ Admin account created');

    // Create 7 realistic sellers
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

    // Create 3 buyers
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

    // Create 30 products
    const productData = [
        // ELECTRONICS (8)
        { title: 'Dell Inspiron 15 Laptop', price: 35000, stock: 1, seller: sellers[0], category: 'ELECTRONICS', condition: 'USED', years: 2, desc: 'Dell Inspiron 15 with Intel i5 10th Gen, 8GB RAM, 512GB SSD. Excellent working condition, minor scratches on lid, includes original charger and USB cable. Battery health is good (80%).' },
        { title: 'Sony Bravia 55" 4K TV', price: 28000, stock: 1, seller: sellers[1], category: 'ELECTRONICS', condition: 'USED', years: 3, desc: 'Sony Bravia 55 inch 4K Smart TV with HDR support. Remote control included. Works perfectly, very minor bezel scratches that dont affect display. Wall mount compatible with VESA mounting.' },
        { title: 'Canon EOS 1500D DSLR Camera', price: 22000, stock: 1, seller: sellers[2], category: 'ELECTRONICS', condition: 'LIKE_NEW', years: 1, desc: 'Canon EOS 1500D DSLR camera with 18-55mm lens, extra battery, memory card and original box. Shutter count under 5000. Perfect for photography beginners and enthusiasts. Comes with all original accessories.' },
        { title: 'LG Washing Machine 7kg', price: 18000, stock: 1, seller: sellers[3], category: 'ELECTRONICS', condition: 'USED', years: 4, desc: 'LG 7kg front load washing machine with Fuzzy Logic technology. Excellent working condition with all cycles functioning perfectly. Some minor rust on exterior but motor and internals are in great condition. Very reliable machine.' },
        { title: 'Lenovo ThinkPad Tablet', price: 12000, stock: 1, seller: sellers[0], category: 'ELECTRONICS', condition: 'USED', years: 2, desc: 'Lenovo ThinkPad 8-inch tablet with Snapdragon processor, 4GB RAM. Perfect for reading, browsing and light work. Screen protector applied. Charger included. Battery holds charge for 6+ hours. Minimal usage.' },
        { title: 'Bose Quiet Comfort Headphones', price: 15000, stock: 1, seller: sellers[1], category: 'ELECTRONICS', condition: 'LIKE_NEW', years: 1, desc: 'Bose QuietComfort wireless headphones with active noise cancellation. Premium sound quality with comfort fit. Comes with original carrying case, charging cable and all accessories. Used very lightly, almost new condition.' },
        { title: 'Air Fryer 4.5L', price: 8500, stock: 1, seller: sellers[4], category: 'ELECTRONICS', condition: 'LIKE_NEW', years: 0, desc: 'Air Fryer 4.5L capacity with digital controls and 1500W power. Multiple preset cooking modes for fries, chicken, vegetables and more. Never used commercially, practically new. Comes with original box and manual.' },
        { title: 'Power Bank 30000mAh', price: 3500, stock: 1, seller: sellers[5], category: 'ELECTRONICS', condition: 'USED', years: 1, desc: 'Power Bank 30000mAh with fast charging support for phones and tablets. Multiple USB ports. Original cable included. Battery still holds great charge (85% capacity). Lightweight and portable for travel.' },
        // MOBILES (8)
        { title: 'iPhone 12 64GB Space Gray', price: 42000, stock: 1, seller: sellers[2], category: 'MOBILES', condition: 'USED', years: 2, desc: 'iPhone 12 64GB in Space Gray with A14 Bionic chip. Screen has hairline crack but fully functional. Battery health 75%. Dual camera system works perfectly. 5G ready with all features working. Comes with basic accessories.' },
        { title: 'Samsung Galaxy S21 5G', price: 48000, stock: 1, seller: sellers[3], category: 'MOBILES', condition: 'LIKE_NEW', years: 1, desc: 'Samsung Galaxy S21 5G with Snapdragon 888 processor, 8GB RAM. 120Hz AMOLED display in excellent condition. Minimal usage marks. Battery health 95%. Original charger and accessories included. Almost pristine condition.' },
        { title: 'OnePlus 9 Pro 256GB', price: 38000, stock: 1, seller: sellers[0], category: 'MOBILES', condition: 'LIKE_NEW', years: 1, desc: 'OnePlus 9 Pro 256GB with Snapdragon 888, 120Hz AMOLED screen. 48MP Hasselblad camera system. Comes with original box, charger and screen protector. Mint condition with no visible scratches or dents.' },
        { title: 'Redmi Note 10 Pro 128GB', price: 18000, stock: 1, seller: sellers[1], category: 'MOBILES', condition: 'USED', years: 2, desc: 'Redmi Note 10 Pro 128GB with Snapdragon 732G processor. 120Hz IPS LCD display, 108MP main camera. Minor scratches on sides, screen perfectly fine. Good battery health. All features working smoothly.' },
        { title: 'Google Pixel 5a 128GB', price: 32000, stock: 1, seller: sellers[4], category: 'MOBILES', condition: 'LIKE_NEW', years: 1, desc: 'Google Pixel 5a 128GB with Snapdragon 765G. Famous Pixel camera magic for great photos. Water resistant (IP67). Original packaging intact with all accessories. Very light usage, near mint condition.' },
        { title: 'Mi 11 Lite 128GB', price: 22000, stock: 1, seller: sellers[5], category: 'MOBILES', condition: 'USED', years: 1, desc: 'Xiaomi Mi 11 Lite 128GB with Snapdragon 732G AMOLED display. Lightweight design at 159g. Good battery life with proper charging. Minor edge wear from normal use. Charger included. Functions perfectly.' },
        { title: 'iPhone 11 128GB Purple', price: 35000, stock: 1, seller: sellers[6], category: 'MOBILES', condition: 'USED', years: 2, desc: 'iPhone 11 128GB in Purple color with A13 Bionic chip. Great dual camera system. Battery health 82%. Minor scratches on back glass. All features working perfectly. Includes charger and basic accessories.' },
        { title: 'Samsung Galaxy A52 128GB', price: 24000, stock: 1, seller: sellers[0], category: 'MOBILES', condition: 'LIKE_NEW', years: 1, desc: 'Samsung Galaxy A52 128GB with Snapdragon 720G processor, 90Hz display. 64MP quad camera setup. Comes with original charger and screen protector applied. Very minimal usage, practically new condition.' },
        // FURNITURE (6)
        { title: 'Wooden Dining Table 6-seater', price: 18000, stock: 1, seller: sellers[1], category: 'FURNITURE', condition: 'USED', years: 5, desc: 'Solid oak wood dining table for 6 people. Good finish with spacious top (180x90cm). Some light wear marks and scratches from normal dining use but very sturdy and functional. Delivery can be arranged locally.' },
        { title: 'Leather Office Chair', price: 12000, stock: 1, seller: sellers[2], category: 'FURNITURE', condition: 'USED', years: 3, desc: 'Comfortable leather office chair with mesh back support and adjustable height. All wheels roll smoothly. Slight wear on seat leather from regular use but still very comfortable. Armrests adjustable. Works like new.' },
        { title: 'Bookshelf Wooden 5-tier', price: 8000, stock: 1, seller: sellers[3], category: 'FURNITURE', condition: 'USED', years: 2, desc: 'Solid wooden 5-tier bookshelf with dark finish. Great storage for books and decorative items. Some light scratches on shelves from use. Very sturdy construction. All hardware and installation tools included.' },
        { title: 'Bed Frame Queen Size', price: 15000, stock: 1, seller: sellers[4], category: 'FURNITURE', condition: 'USED', years: 2, desc: 'Queen size metal bed frame with strong support system. Easy assembly/disassembly for moving. Minimal wear from use. Supports weight perfectly. Mattress not included but frame in excellent condition. High quality construction.' },
        { title: 'Coffee Table Glass Top', price: 6500, stock: 1, seller: sellers[5], category: 'FURNITURE', condition: 'LIKE_NEW', years: 1, desc: 'Modern coffee table with glass top and metal frame. Beautiful contemporary design perfect for living rooms. No scratches on glass surface. Very stylish and barely used. Adds elegance to any space.' },
        { title: 'Wardrobe 3-door', price: 22000, stock: 1, seller: sellers[0], category: 'FURNITURE', condition: 'USED', years: 3, desc: 'Spacious 3-door wooden wardrobe with interior mirror. Good storage capacity with shelves and hanging rails. One door hinge slightly loose but easily fixable. Mirror intact. Very functional and well-made.' },
        // FASHION (4)
        { title: 'Branded Winter Jacket', price: 5500, stock: 1, seller: sellers[1], category: 'FASHION', condition: 'USED', years: 2, desc: 'Columbia brand waterproof winter jacket in Size M. Insulated lining keeps you warm. Slight pilling from washing but no tears or stains. All zippers work smoothly. Great for cold weather wear.' },
        { title: 'Leather Crossbody Bag', price: 4500, stock: 1, seller: sellers[2], category: 'FASHION', condition: 'LIKE_NEW', years: 1, desc: 'Genuine leather crossbody bag in brown color. Perfect for daily use with adjustable strap. No scuffs or wear marks. All hardware in perfect condition. Very spacious compartments. Classic style never goes out of fashion.' },
        { title: 'Sports Running Shoes Size 10', price: 3500, stock: 1, seller: sellers[3], category: 'FASHION', condition: 'USED', years: 1, desc: 'Nike sports running shoes in Size 10. Lightly worn for casual runs. Sole in excellent condition with good traction. Comfortable fit for daily wear. Original box included. Great value for second-hand sports footwear.' },
        { title: 'Designer Sunglasses', price: 2800, stock: 1, seller: sellers[4], category: 'FASHION', condition: 'LIKE_NEW', years: 0, desc: 'Ray-Ban style designer sunglasses with UV protection and polarized lenses. Never worn, new condition. Comes with original case and cleaning cloth. Perfect for sun protection and style. High quality construction.' },
        // ACCESSORIES (4)
        { title: 'Smartwatch Fitbit Charge 4', price: 11000, stock: 1, seller: sellers[5], category: 'ACCESSORIES', condition: 'USED', years: 1, desc: 'Fitbit Charge 4 smartwatch with heart rate monitoring and GPS enabled. Water resistant for swimming. Charging cable included. Minor scratches on screen protector. Good battery health for daily tracking of fitness activities.' },
        { title: 'Portable Bluetooth Speaker', price: 7500, stock: 1, seller: sellers[0], category: 'ACCESSORIES', condition: 'USED', years: 1, desc: 'JBL Flip 5 portable Bluetooth speaker. Waterproof design perfect for outdoor use. 12-hour battery life. Excellent sound quality with good bass. Charging cable included. Minor cosmetic wear from use.' },
        { title: 'USB-C Hub Adapter', price: 2000, stock: 1, seller: sellers[1], category: 'ACCESSORIES', condition: 'LIKE_NEW', years: 0, desc: 'USB-C Hub adapter with multiple ports (USB 3.0, HDMI, SD Card reader). Aluminum build for durability. Compatible with laptops and tablets. Original packaging intact. All drivers included. Perfect for expanding connectivity.' },
        { title: 'Phone Stand for Desk', price: 1200, stock: 1, seller: sellers[2], category: 'ACCESSORIES', condition: 'LIKE_NEW', years: 0, desc: 'Adjustable aluminum phone stand for desk with non-slip base. Minimalist modern design. Supports all phone sizes and even light tablets. Very stable and portable. Perfect for video calls and content viewing.' },
    ];

    const products = await Promise.all(
        productData.map((p: any) =>
            prisma.product.create({
                data: {
                    title: p.title,
                    description: p.desc,
                    price: p.price,
                    stock: p.stock,
                    usageYears: p.years,
                    category: p.category as any,
                    condition: p.condition as any,
                    sellerId: p.seller.id,
                    imageUrl: `https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`,
                },
            })
        )
    );

    console.log(`✓ Created ${products.length} products`);

    console.log('\n========== SEEDING COMPLETE ==========\n');
    console.log('Admin:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}\n`);
    console.log('Test Sellers & Buyers:');
    sellers.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} (${s.email})`));
    buyers.forEach((b, i) => console.log(`  ${i + 7 + 1}. ${b.name} (${b.email})`));
    console.log(`\nAll use password: Password123\n`);
    console.log('======================================\n');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
