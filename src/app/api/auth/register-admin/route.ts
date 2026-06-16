import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "ইমেইল এবং পাসওয়ার্ড দুটিই প্রয়োজন।" },
        { status: 400 }
      );
    }

    // 1. Get or Create SUPER_ADMIN Role
    let adminRole = await prisma.role.findUnique({
      where: { name: "SUPER_ADMIN" },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: "SUPER_ADMIN",
          description: "System Administrator with all privileges",
        },
      });
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create User
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
      },
    });

    // 4. Assign SUPER_ADMIN role
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "সুপার এডমিন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।",
    });
  } catch (error) {
    console.error("Register Admin API Error:", error);
    return NextResponse.json(
      { success: false, message: "সার্ভারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
