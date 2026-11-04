import { prisma } from "../lib/prisma.js";

// GET: Get all skills
export async function getSkills(req, res, next) {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    res.json({
      success: true,
      count: skills.length,
      skills,
    });
  } catch (error) {
    next(error);
  }
}

// POST: Create a new skill
export async function createSkill(req, res, next) {
  try {
    const { name, category, level, order } = req.body;

    if (!name?.trim() || !category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      });
    }

    if (
      level !== undefined &&
      (!Number.isInteger(level) || level < 0 || level > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Level must be an integer between 0 and 100",
      });
    }

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        level: level ?? 0,
        order: order ?? 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Skill created successfully",
      skill,
    });
  } catch (error) {
    next(error);
  }
}

// PUT: Update an existing skill
export async function updateSkill(req, res, next) {
  try {
    const { name, category, level, order } = req.body;

    if (
      level !== undefined &&
      (!Number.isInteger(level) || level < 0 || level > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Level must be an integer between 0 and 100",
      });
    }

    const skill = await prisma.skill.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(level !== undefined && { level }),
        ...(order !== undefined && { order }),
      },
    });

    res.json({
      success: true,
      message: "Skill updated successfully",
      skill,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    next(error);
  }
}

// DELETE: Delete a skill
export async function deleteSkill(req, res, next) {
  try {
    await prisma.skill.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Skill deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    next(error);
  }
}