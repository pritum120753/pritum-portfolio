
import { prisma } from "../lib/prisma.js";

export async function getProjects(req, res, next) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    const {
      title,
      description,
      image,
      liveUrl,
      githubUrl,
      technologies,
      featured,
      order,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (
      technologies !== undefined &&
      (!Array.isArray(technologies) ||
        !technologies.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Technologies must be an array of strings",
      });
    }

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        image,
        liveUrl,
        githubUrl,
        technologies: technologies || [],
        featured: featured ?? false,
        order: order ?? 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const {
      title,
      description,
      image,
      liveUrl,
      githubUrl,
      technologies,
      featured,
      order,
    } = req.body;

    if (
      technologies !== undefined &&
      (!Array.isArray(technologies) ||
        !technologies.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Technologies must be an array of strings",
      });
    }

    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description.trim(),
        }),
        ...(image !== undefined && { image }),
        ...(liveUrl !== undefined && { liveUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(technologies !== undefined && { technologies }),
        ...(featured !== undefined && { featured }),
        ...(order !== undefined && { order }),
      },
    });

    res.json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const existingProject = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
