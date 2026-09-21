import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getCurrentMonthYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function main() {
  console.log("Seeding database with default user, deals, and 50/30/20 budgets...");

  const currentMonth = getCurrentMonthYear();

  // 1. Create or update Default User
  const user = await prisma.user.upsert({
    where: { email: "user@smartfinance.ai" },
    update: {},
    create: {
      id: "demo-user-1",
      name: "Alex Morgan",
      email: "user@smartfinance.ai",
      currency: "INR",
      monthlyIncome: 100000,
      salaryCreditDay: 1,
    },
  });

  console.log(`User created/found: ${user.name} (${user.id})`);

  // 2. Seed Localized Deals
  const deals = [
    {
      id: "deal-1",
      platformName: "Blinkit",
      category: "Groceries",
      title: "15% Instant Off on Monthly Grocery Supplies",
      promoCode: "BLINKIT15",
      discountPercentage: 15.0,
      affiliateUrl: "https://blinkit.com",
    },
    {
      id: "deal-2",
      platformName: "Zepto",
      category: "Groceries",
      title: "Flat ₹100 Cashback on Fresh Fruits & Vegetables",
      promoCode: "ZEPTOFRESH",
      discountPercentage: 10.0,
      affiliateUrl: "https://zepto.com",
    },
    {
      id: "deal-3",
      platformName: "Swiggy Gourmet",
      category: "Dining Out",
      title: "20% Off on Top Restaurants & Dining Out",
      promoCode: "SWIGGY20",
      discountPercentage: 20.0,
      affiliateUrl: "https://swiggy.com",
    },
    {
      id: "deal-4",
      platformName: "HP Fuel",
      category: "Petrol",
      title: "5% Fuel Cashback on GPay UPI Payments",
      promoCode: "HPFUEL5",
      discountPercentage: 5.0,
      affiliateUrl: "https://gpay.app",
    },
    {
      id: "deal-5",
      platformName: "Amazon India",
      category: "Shopping",
      title: "10% Instant Discount with HDFC/ICICI Cards",
      promoCode: "AMZ10OFF",
      discountPercentage: 10.0,
      affiliateUrl: "https://amazon.in",
    },
  ];

  for (const d of deals) {
    await prisma.deal.upsert({
      where: { id: d.id },
      update: d,
      create: d,
    });
  }
  console.log(`Seeded ${deals.length} active localized deals.`);

  // 3. Seed 50/30/20 Categories for current month
  const initialCategories = [
    // Needs (50% = ₹50,000)
    { categoryName: "Rent", isEssential: true, allocatedAmount: 25000, currentSpent: 25000 },
    { categoryName: "Groceries", isEssential: true, allocatedAmount: 15000, currentSpent: 11200 },
    { categoryName: "Petrol", isEssential: true, allocatedAmount: 10000, currentSpent: 6500 },
    // Wants (30% = ₹30,000)
    { categoryName: "Dining Out", isEssential: false, allocatedAmount: 10000, currentSpent: 7200 },
    { categoryName: "Shopping", isEssential: false, allocatedAmount: 10000, currentSpent: 8900 },
    { categoryName: "Entertainment", isEssential: false, allocatedAmount: 10000, currentSpent: 3500 },
    // Savings (20% = ₹20,000)
    { categoryName: "Emergency Fund", isEssential: true, allocatedAmount: 10000, currentSpent: 0 },
    { categoryName: "Investments", isEssential: true, allocatedAmount: 10000, currentSpent: 0 },
  ];

  for (const cat of initialCategories) {
    await prisma.categoryBudget.upsert({
      where: {
        userId_categoryName_monthYear: {
          userId: user.id,
          categoryName: cat.categoryName,
          monthYear: currentMonth,
        },
      },
      update: {
        allocatedAmount: cat.allocatedAmount,
        isEssential: cat.isEssential,
      },
      create: {
        userId: user.id,
        categoryName: cat.categoryName,
        isEssential: cat.isEssential,
        allocatedAmount: cat.allocatedAmount,
        currentSpent: cat.currentSpent,
        monthYear: currentMonth,
      },
    });
  }

  console.log("50/30/20 Category budgets initialized successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
