
import { prisma } from "../lib/prisma.js";

const defaultContent = {
  id: "main",
  badge: "Who I Am",
  heading: "Analytical mindset. Technical creativity.",
  description: "",
  additionalText: "",
  experienceValue: "3+ Years",
  experienceTitle: "Professional Experience",
  experienceSubtitle: "Supporting U.S. residential appraisal firms",
  academicValue: "Computer Science",
  academicTitle: "Academic Focus",
  academicSubtitle: "Software development and system design",
  interestsValue: "Data + Technology",
  interestsTitle: "Core Interests",
  interestsSubtitle: "Turning analysis into practical solutions",
};

// GET: Public About content
export async function getAbout(req, res, next) {
  try {
    const about = await prisma.aboutContent.upsert({
      where: { id: "main" },
      update: {},
      create: defaultContent,
    });

    res.json({
      success: true,
      about,
    });
  } catch (error) {
    next(error);
  }
}

// PUT: Update About content (Admin only)
export async function updateAbout(req, res, next) {
  try {
    const allowedFields = [
      "badge",
      "heading",
      "description",
      "additionalText",
      "experienceValue",
      "experienceTitle",
      "experienceSubtitle",
      "academicValue",
      "academicTitle",
      "academicSubtitle",
      "interestsValue",
      "interestsTitle",
      "interestsSubtitle",
    ];

    const data = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be a string`,
          });
        }

        data[field] = req.body[field].trim();
      }
    }

    const about = await prisma.aboutContent.upsert({
      where: { id: "main" },
      update: data,
      create: {
        ...defaultContent,
        ...data,
      },
    });

    res.json({
      success: true,
      message: "About content updated successfully",
      about,
    });
  } catch (error) {
    next(error);
  }
}
