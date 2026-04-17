import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.project.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create demo tenant + owner
  const password = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.create({
    data: {
      email: "owner@demo.com",
      name: "Demo Owner",
      password,
      memberships: {
        create: {
          role: "OWNER",
          tenant: {
            create: { name: "Demo Company", slug: "demo-company" },
          },
        },
      },
    },
    include: { memberships: true },
  });

  const tenantId = owner.memberships[0].tenantId;

  // Create a member
  const member = await prisma.user.create({
    data: {
      email: "member@demo.com",
      name: "Demo Member",
      password,
      memberships: {
        create: { role: "MEMBER", tenantId },
      },
    },
  });

  // Create sample projects
  await prisma.project.createMany({
    data: [
      { name: "Website Redesign", description: "Redesign the company website", tenantId },
      { name: "Mobile App", description: "Build iOS and Android app", tenantId },
      { name: "API Integration", description: "Integrate with third-party APIs", tenantId },
    ],
  });

  console.log("Seed complete!");
  console.log(`  Owner: owner@demo.com / password123`);
  console.log(`  Member: member@demo.com / password123`);
  console.log(`  Tenant ID: ${tenantId}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
