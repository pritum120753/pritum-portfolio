import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
const promoteToSuperAdmin = Boolean(superAdminEmail && email === superAdminEmail);

if (!name || !email || !password || password.length < 12) {
  console.error("Set ADMIN_NAME, ADMIN_EMAIL and a password of at least 12 characters in .env");
  process.exitCode = 1;
} else {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.$transaction(async (transaction) => {
      const account = await transaction.user.upsert({
        where: { email },
        update: {
          name,
          password: hashedPassword,
          ...(promoteToSuperAdmin ? { role: "SUPER_ADMIN" } : {}),
        },
        create: {
          name,
          email,
          password: hashedPassword,
          role: promoteToSuperAdmin ? "SUPER_ADMIN" : "ADMIN",
        },
      });

      if (promoteToSuperAdmin) {
        await transaction.user.updateMany({
          where: {
            role: "SUPER_ADMIN",
            id: { not: account.id },
          },
          data: { role: "ADMIN" },
        });
      }

      return account;
    });

    console.log(
      `Account ready: ${admin.email} (${admin.role}).${promoteToSuperAdmin ? " Other super admin roles, if any, were downgraded to ADMIN." : ""}`
    );
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
