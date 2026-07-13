import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.session.deleteMany();
  await prisma.businessSetting.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const business = await prisma.business.create({
    data: {
      name: "Tammy's Spaza",
      slug: "tammys-spaza",
      email: "demo@tammyshop.co.za",
      phone: "+27821234567",
      address: "12 Freedom Street",
      city: "Johannesburg",
      province: "Gauteng",
      postalCode: "2001",
      vatNumber: "4123456789",
      settings: { create: {} },
      subscription: {
        create: {
          plan: "ADVANCED",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const owner = await prisma.user.create({
    data: {
      businessId: business.id,
      email: "demo@tammyshop.co.za",
      phone: "+27821234567",
      passwordHash,
      fullName: "Tammy Owner",
      role: "OWNER",
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      businessId: business.id,
      email: "manager@tammyshop.co.za",
      passwordHash,
      fullName: "Maya Manager",
      role: "MANAGER",
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      businessId: business.id,
      email: "staff@tammyshop.co.za",
      passwordHash,
      fullName: "Sipho Employee",
      role: "EMPLOYEE",
      emailVerified: true,
    },
  });

  const units = await Promise.all(
    [
      ["Each", "ea"],
      ["Pack", "pk"],
      ["Litre", "L"],
      ["Kilogram", "kg"],
    ].map(([name, abbreviation]) =>
      prisma.unit.create({ data: { businessId: business.id, name, abbreviation } })
    )
  );

  const categories = await Promise.all(
    ["Beverages", "Bread & Bakery", "Groceries", "Dairy", "Snacks", "Household"].map((name, i) =>
      prisma.category.create({ data: { businessId: business.id, name, sortOrder: i } })
    )
  );

  const brands = await Promise.all(
    ["Coca-Cola", "Albany", "Tastic", "Clover", "Sunlight"].map((name) =>
      prisma.brand.create({ data: { businessId: business.id, name } })
    )
  );

  const supplier = await prisma.supplier.create({
    data: {
      businessId: business.id,
      name: "Jozi Cash & Carry",
      contactName: "Thabo",
      phone: "+27831112222",
      email: "orders@jozicc.co.za",
      address: "Industrial Park, Johannesburg",
      city: "Johannesburg",
      leadTimeDays: 2,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: "Regular Customer",
      phone: "+27829998877",
      loyaltyPoints: 120,
      totalSpentCents: 245000,
    },
  });

  const catalog = [
    { name: "Coca-Cola 2L", cat: 0, brand: 0, cost: 1400, sell: 2200, qty: 48, min: 12, barcode: "6001234567001" },
    { name: "White Bread", cat: 1, brand: 1, cost: 1000, sell: 1600, qty: 20, min: 10, barcode: "6001234567002" },
    { name: "Rice 2kg", cat: 2, brand: 2, cost: 2800, sell: 4200, qty: 15, min: 8, barcode: "6001234567003" },
    { name: "Sugar 1kg", cat: 2, brand: 2, cost: 1800, sell: 2600, qty: 4, min: 10, barcode: "6001234567004" },
    { name: "Milk 2L", cat: 3, brand: 3, cost: 2200, sell: 3200, qty: 18, min: 10, barcode: "6001234567005" },
    { name: "Chips Assorted", cat: 4, brand: 0, cost: 800, sell: 1400, qty: 60, min: 20, barcode: "6001234567006" },
    { name: "Sunlight Soap", cat: 5, brand: 4, cost: 1200, sell: 1900, qty: 0, min: 8, barcode: "6001234567007" },
    { name: "Maize Meal 5kg", cat: 2, brand: 2, cost: 4500, sell: 6200, qty: 25, min: 6, barcode: "6001234567008" },
    { name: "Eggs 18s", cat: 3, brand: 3, cost: 3500, sell: 4800, qty: 12, min: 6, barcode: "6001234567009" },
    { name: "Cooking Oil 2L", cat: 2, brand: 2, cost: 3800, sell: 5200, qty: 3, min: 8, barcode: "6001234567010" },
  ];

  const products = [];
  for (let i = 0; i < catalog.length; i++) {
    const item = catalog[i];
    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: categories[item.cat].id,
        brandId: brands[item.brand].id,
        unitId: units[0].id,
        supplierId: supplier.id,
        name: item.name,
        sku: `TM-${String(i + 1).padStart(4, "0")}`,
        barcode: item.barcode,
        costPriceCents: item.cost,
        sellPriceCents: item.sell,
        quantity: new Decimal(item.qty),
        minStock: new Decimal(item.min),
        maxStock: new Decimal(item.min * 5),
        location: "Shelf A",
      },
    });
    products.push(product);
  }

  // Seed historical sales for analytics
  for (let d = 14; d >= 0; d--) {
    const day = new Date();
    day.setDate(day.getDate() - d);
    const picks = [products[0], products[1], products[4], products[5]];
    let subtotal = 0;
    let cost = 0;
    const items = picks.map((p, idx) => {
      const qty = 1 + ((d + idx) % 3);
      const line = p.sellPriceCents * qty;
      const lineCost = p.costPriceCents * qty;
      subtotal += line;
      cost += lineCost;
      return {
        productId: p.id,
        productName: p.name,
        quantity: new Decimal(qty),
        unitPriceCents: p.sellPriceCents,
        costPriceCents: p.costPriceCents,
        totalCents: line,
        profitCents: line - lineCost,
      };
    });

    await prisma.sale.create({
      data: {
        businessId: business.id,
        customerId: d % 3 === 0 ? customer.id : null,
        cashierId: owner.id,
        invoiceNumber: `INV-${String(1000 + d)}`,
        paymentMethod: d % 2 === 0 ? "CASH" : "CARD",
        subtotalCents: subtotal,
        totalCents: subtotal,
        costCents: cost,
        profitCents: subtotal - cost,
        createdAt: day,
        items: { create: items },
        payments: { create: [{ method: d % 2 === 0 ? "CASH" : "CARD", amountCents: subtotal }] },
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        businessId: business.id,
        type: "LOW_STOCK",
        title: "Low stock",
        message: "Sugar 1kg is below minimum stock",
        link: `/inventory/products/${products[3].id}`,
      },
      {
        businessId: business.id,
        type: "OUT_OF_STOCK",
        title: "Out of stock",
        message: "Sunlight Soap is out of stock",
        link: `/inventory/products/${products[6].id}`,
      },
      {
        businessId: business.id,
        type: "DAILY_SUMMARY",
        title: "Daily summary",
        message: "Yesterday's sales look healthy. Check the dashboard for details.",
        link: "/dashboard",
      },
    ],
  });

  await prisma.coupon.create({
    data: {
      businessId: business.id,
      code: "WELCOME10",
      description: "10% off",
      discountPercent: new Decimal(10),
    },
  });

  console.log("Seeded TammyShop demo data");
  console.log("Login: demo@tammyshop.co.za / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
