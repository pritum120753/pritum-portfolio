-- CreateTable
CREATE TABLE "AboutContent" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "badge" TEXT NOT NULL DEFAULT 'Who I Am',
    "heading" TEXT NOT NULL DEFAULT 'Analytical mindset. Technical creativity.',
    "description" TEXT NOT NULL,
    "additionalText" TEXT NOT NULL,
    "experienceValue" TEXT NOT NULL DEFAULT '3+ Years',
    "experienceTitle" TEXT NOT NULL DEFAULT 'Professional Experience',
    "experienceSubtitle" TEXT NOT NULL DEFAULT 'Supporting U.S. residential appraisal firms',
    "academicValue" TEXT NOT NULL DEFAULT 'Computer Science',
    "academicTitle" TEXT NOT NULL DEFAULT 'Academic Focus',
    "academicSubtitle" TEXT NOT NULL DEFAULT 'Software development and system design',
    "interestsValue" TEXT NOT NULL DEFAULT 'Data + Technology',
    "interestsTitle" TEXT NOT NULL DEFAULT 'Core Interests',
    "interestsSubtitle" TEXT NOT NULL DEFAULT 'Turning analysis into practical solutions',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutContent_pkey" PRIMARY KEY ("id")
);
