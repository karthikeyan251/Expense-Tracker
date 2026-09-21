import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters long" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // Create user account
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password,
        monthlyIncome: 0,
        monthlyRent: 0,
        otherFixedExpenses: 0,
        savingsGoal: 0,
        currency: "INR",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        monthlyRent: user.monthlyRent,
        otherFixedExpenses: user.otherFixedExpenses,
        savingsGoal: user.savingsGoal,
        currency: user.currency,
      },
      needsSetup: true,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
