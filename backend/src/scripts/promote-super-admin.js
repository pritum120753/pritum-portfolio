import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

if (!email) {
  console.error("Set SUPER_ADMIN_EMAIL to the email of the existing admin account.");
  process.exitCode = 1;
} else {
  try {
    const promoted = await prisma.$transaction(async (transaction) => {
      const account = await transaction.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!account || !["ADMIN", "SUPER_ADMIN"].includes(account.role)) {
        throw new Error("No existing Admin account was found for SUPER_ADMIN_EMAIL.");
      }

      await transaction.user.update({
        where: { id: account.id },
        data: { role: "SUPER_ADMIN" },
      });

      await transaction.user.updateMany({
        where: {
          role: "SUPER_ADMIN",
          id: { not: account.id },
        },
        data: { role: "ADMIN" },
      });

      return account;
    });

    console.log(`Promoted ${promoted.email} to SUPER_ADMIN. Password was not changed.`);
    console.log("Any previous Super Admin account has been changed to regular ADMIN.");
  } catch (error) {
    console.error("Super Admin promotion failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
