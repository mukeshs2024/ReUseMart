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

    console.log('Admin account created.');
    console.log('Email: ' + adminEmail);
    console.log('Password: ' + adminPassword);
    console.log('Admin id: ' + admin.id);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
