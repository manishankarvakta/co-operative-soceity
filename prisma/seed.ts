import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'System Administrator with all privileges',
    },
  });

  const accountantRole = await prisma.role.upsert({
    where: { name: 'ACCOUNTANT' },
    update: {},
    create: {
      name: 'ACCOUNTANT',
      description: 'Accountant to manage finance',
    },
  });

  const presidentRole = await prisma.role.upsert({
    where: { name: 'PRESIDENT' },
    update: {},
    create: {
      name: 'PRESIDENT',
      description: 'President of the cooperative',
    },
  });

  const secretaryRole = await prisma.role.upsert({
    where: { name: 'SECRETARY' },
    update: {},
    create: {
      name: 'SECRETARY',
      description: 'Secretary of the cooperative',
    },
  });

  const treasurerRole = await prisma.role.upsert({
    where: { name: 'TREASURER' },
    update: {},
    create: {
      name: 'TREASURER',
      description: 'Treasurer of the cooperative',
    },
  });

  console.log('Roles created or already exist.');

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@somoby.com' },
    update: {
      passwordHash,
    },
    create: {
      email: 'admin@somoby.com',
      passwordHash,
    },
  });

  console.log('Admin user created:', adminUser.email);

  // 3. Assign SUPER_ADMIN role to user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create additional test users for bank transactions
  const rolesMap = [
    { email: 'accountant@somoby.com', role: accountantRole },
    { email: 'president@somoby.com', role: presidentRole },
    { email: 'secretary@somoby.com', role: secretaryRole },
    { email: 'treasurer@somoby.com', role: treasurerRole },
  ];

  for (const item of rolesMap) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { passwordHash },
      create: {
        email: item.email,
        passwordHash,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: item.role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: item.role.id,
      },
    });
    console.log('Created user:', user.email, 'with role:', item.role.name);
  }

  // 4. Create some basic Chart of Accounts (COA) for tests
  const accountsToCreate = [
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Bank Account (Sonali)', type: 'ASSET' },
    { code: '2000', name: 'Member Savings/Deposits', type: 'LIABILITY' },
    { code: '3000', name: 'Share Capital', type: 'EQUITY' },
    { code: '4000', name: 'Admission Fees', type: 'REVENUE' },
    { code: '5000', name: 'Office Expense', type: 'EXPENSE' },
  ];

  for (const acc of accountsToCreate) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
      },
    });
  }

  console.log('Basic Chart of Accounts created.');

  // 5. Create a Bank Account
  await prisma.bankAccount.upsert({
    where: { accountNumber: '1234567890' },
    update: {},
    create: {
      name: 'Sonali Bank Ltd.',
      accountNumber: '1234567890',
      balance: 1000000, // 10,000 BDT
    },
  });
  console.log('Test bank account created.');

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
