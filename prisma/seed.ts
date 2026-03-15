import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/config/betterAuth";


const seedAdmin = {
  name: process.env.SEED_ADMIN_NAME ?? "Super Admin",
  email: process.env.SEED_ADMIN_EMAIL ?? "admin@club.com",
  password: process.env.SEED_ADMIN_PASSWORD ?? "Admin12345",
};

const seedSite = {
  organizationName: process.env.SEED_ORGANIZATION_NAME ?? "Club Portal",
  contactEmail: process.env.SEED_CONTACT_EMAIL ?? seedAdmin.email,
};

const ensureAdminUser = async () => {
  const existingUser = await prisma.user.findUnique({
    where: { email: seedAdmin.email },
    select: { id: true, email: true, role: true },
  });

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        name: seedAdmin.name,
        email: seedAdmin.email,
        password: seedAdmin.password,
      },
    });
  }

  const adminUser = await prisma.user.update({
    where: { email: seedAdmin.email },
    data: { role: "SUPER_ADMIN" },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    user: adminUser,
    created: !existingUser,
  };
};

const ensureSiteSetting = async () => {
  const existingSetting = await prisma.siteSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existingSetting) {
    return {
      setting: existingSetting,
      created: false,
    };
  }

  const setting = await prisma.siteSetting.create({
    data: {
      organizationName: seedSite.organizationName,
      contactEmail: seedSite.contactEmail,
    },
  });

  return {
    setting,
    created: true,
  };
};

const main = async () => {
  const adminResult = await ensureAdminUser();
  const settingResult = await ensureSiteSetting();

  console.log("Seed completed.");
  console.log(
    JSON.stringify(
      {
        admin: {
          created: adminResult.created,
          email: adminResult.user.email,
          role: adminResult.user.role,
          defaultPassword: adminResult.created ? seedAdmin.password : undefined,
        },
        siteSetting: {
          created: settingResult.created,
          organizationName: settingResult.setting.organizationName,
        },
      },
      null,
      2,
    ),
  );
};

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
