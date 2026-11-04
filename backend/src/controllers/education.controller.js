import { prisma } from "../lib/prisma.js";

// GET all education records
export async function getEducations(req, res, next) {
  try {
    const educations = await prisma.education.findMany({
      orderBy: { startDate: "desc" },
    });

    res.json({
      success: true,
      count: educations.length,
      educations,
    });
  } catch (error) {
    next(error);
  }
}

// CREATE education
export async function createEducation(req, res, next) {
  try {
    const {
      institution,
      degree,
      field,
      description,
      startDate,
      endDate,
    } = req.body;

    if (!institution?.trim() || !degree?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Institution and degree are required",
      });
    }

    const education = await prisma.education.create({
      data: {
        institution: institution.trim(),
        degree: degree.trim(),
        field: field?.trim() || null,
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      education,
    });
  } catch (error) {
    next(error);
  }
}

// UPDATE education
export async function updateEducation(req, res, next) {
  try {
    const {
      institution,
      degree,
      field,
      description,
      startDate,
      endDate,
    } = req.body;

    const education = await prisma.education.update({
      where: { id: req.params.id },
      data: {
        ...(institution !== undefined && {
          institution: institution.trim(),
        }),
        ...(degree !== undefined && { degree: degree.trim() }),
        ...(field !== undefined && { field: field.trim() || null }),
        ...(description !== undefined && {
          description: description.trim() || null,
        }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
      },
    });

    res.json({ success: true, education });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    next(error);
  }
}

// DELETE education
export async function deleteEducation(req, res, next) {
  try {
    await prisma.education.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Education record deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    next(error);
  }
}