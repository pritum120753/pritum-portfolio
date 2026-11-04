
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skills = [
  { name: "JavaScript", category: "Frontend", level: 90, order: 2 },
  { name: "Python", category: "Programming", level: 85, order: 3 },
  { name: "HTML", category: "Frontend", level: 95, order: 4 },
  { name: "CSS", category: "Frontend", level: 90, order: 5 },
  { name: "SQL", category: "Database", level: 85, order: 6 },
  { name: "Node.js", category: "Backend", level: 80, order: 7 },
  { name: "Express.js", category: "Backend", level: 80, order: 8 },
  { name: "PostgreSQL", category: "Database", level: 85, order: 9 },
];

try {
  const result = await prisma.skill.createMany({
    data: skills,
  });

  console.log(`${result.count} skills added successfully!`);
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
