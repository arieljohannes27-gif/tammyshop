/**
 * Upserts platform admin + demo shop on production without wiping data.
 * Usage: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/ensure-admin.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@tammyshop.co.za";
const ADMIN_PASSWORD = "AdminDemo2026!";
const DEMO_EMAIL = "demo@tammyshop.co.za";
const DEMO_PASSWORD = "demo1234";

async function main() {
  // Migration: approve shops that already have an active paid plan
  const paid = await prisma.subscription.findMany({
    where: { status: "ACTIVE", plan: { in: ["STARTER", "ADVANCED"] } },
    select: { businessId: true },
  });
  if (paid.length) {
    await prisma.business.updateMany({
      where: { id: { in: paid.map((p) => p.businessId) } },
      data: { approvalStatus: "APPROVED", approvedAt: new Date() },
    });
  }

  let hq = await prisma.business.findUnique({ where: { slug: "tammyshop-hq" } });
  if (!hq) {
    hq = await prisma.business.create({
      data: {
        name: "TammyShop HQ",
        slug: "tammyshop-hq",
        email: ADMIN_EMAIL,
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
        settings: { create: {} },
        subscription: {
          create: {
            plan: "ADVANCED",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    console.log("Created TammyShop HQ business");
  } else {
    await prisma.business.update({
      where: { id: hq.id },
      data: { approvalStatus: "APPROVED", approvedAt: new Date() },
    });
  }

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash: adminHash,
        isPlatformAdmin: true,
        isActive: true,
        emailVerified: true,
        businessId: hq.id,
        fullName: "Platform Admin",
      },
    });
    console.log("Updated platform admin");
  } else {
    await prisma.user.create({
      data: {
        businessId: hq.id,
        email: ADMIN_EMAIL,
        passwordHash: adminHash,
        fullName: "Platform Admin",
        role: "OWNER",
        isPlatformAdmin: true,
        emailVerified: true,
      },
    });
    console.log("Created platform admin");
  }

  let demoBiz = await prisma.business.findUnique({ where: { slug: "tammys-spaza" } });
  if (!demoBiz) {
    demoBiz = await prisma.business.create({
      data: {
        name: "Tammy's Spaza",
        slug: "tammys-spaza",
        email: DEMO_EMAIL,
        phone: "+27821234567",
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
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
    console.log("Created demo business");
  } else {
    await prisma.business.update({
      where: { id: demoBiz.id },
      data: { approvalStatus: "APPROVED", approvedAt: new Date() },
    });
    await prisma.subscription.upsert({
      where: { businessId: demoBiz.id },
      create: {
        businessId: demoBiz.id,
        plan: "ADVANCED",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        plan: "ADVANCED",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const existingDemo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existingDemo) {
    await prisma.user.update({
      where: { id: existingDemo.id },
      data: {
        passwordHash: demoHash,
        isActive: true,
        emailVerified: true,
        businessId: demoBiz.id,
        role: "OWNER",
      },
    });
    console.log("Updated demo user");
  } else {
    await prisma.user.create({
      data: {
        businessId: demoBiz.id,
        email: DEMO_EMAIL,
        passwordHash: demoHash,
        fullName: "Tammy Owner",
        role: "OWNER",
        emailVerified: true,
      },
    });
    console.log("Created demo user");
  }

  console.log("\nCredentials ready:");
  console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Demo:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
