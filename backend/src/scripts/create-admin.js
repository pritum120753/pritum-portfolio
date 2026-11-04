import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password || password.length < 12) {
  console.error("Set ADMIN_NAME, ADMIN_EMAIL and a password of at least 12 characters in .env");
  process.exitCode = 1;
} else {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.upsert({
      where: { email },
      update: { name, password: hashedPassword, role: "ADMIN" },
      create: { name, email, password: hashedPassword, role: "ADMIN" },
    });

    console.log(`Admin account ready: ${admin.email}`);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}