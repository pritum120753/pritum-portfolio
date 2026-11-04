import { prisma } from "../lib/prisma.js";

// GET all experiences
export async function getExperiences(req, res, next) {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { startDate: "desc" },
    });

    res.json({
      success: true,
      count: experiences.length,
      experiences,
    });
  } catch (error) {
    next(error);
  }
}

// CREATE experience
export async function createExperience(req, res, next) {
  try {
    const {
      company,
      position,
      description,
      startDate,
      endDate,
      current,
    } = req.body;

    if (
      !company?.trim() ||
      !position?.trim() ||
      !description?.trim() ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Company, position, description and start date are required",
      });
    }

    const experience = await prisma.experience.create({
      data: {
        company: company.trim(),
        position: position.trim(),
        description: description.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        current: current ?? false,
      },
    });

    res.status(201).json({
      success: true,
      experience,
    });
  } catch (error) {
    next(error);
  }
}

// UPDATE experience
export async function updateExperience(req, res, next) {
  try {
    const {
      company,
      position,
      description,
      startDate,
      endDate,
      current,
    } = req.body;

    const experience = await prisma.experience.update({
      where: { id: req.params.id },
      data: {
        ...(company !== undefined && { company: company.trim() }),
        ...(position !== undefined && { position: position.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(current !== undefined && { current }),
      },
    });

    res.json({ success: true, experience });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }
    next(error);
  }
}

// DELETE experience
export async function deleteExperience(req, res, next) {
  try {
    await prisma.experience.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Experience deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Experience not found",
      });
    }
    next(error);
  }
}