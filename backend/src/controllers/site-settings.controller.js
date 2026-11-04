import { prisma } from "../lib/prisma.js";

const defaults = {
  id: "main", heroBadge: "👋 Welcome to my digital space", heroName: "Pritum Kumar Shill",
  heroTitles: "Computer Science Student\nFull Stack Developer\nAI Enthusiast\nData Science Explorer\nFuture Tech Professional 🚀",
  heroDescription: "Building modern digital experiences, exploring AI and transforming ideas into real-world applications.",
  heroPrimaryText: "Explore My Work 🚀", heroPrimaryUrl: "#projects", heroResumeText: "📄 Download Resume",
  heroResumeUrl: "/resume.pdf", heroImage: "/profile-placeholder.png",
  heroBadges: "Web Development\nData Analysis\nReal Estate Appraisal\nAI Tools",
  email: "pritumshill25@gmail.com", phone: "", location: "",
  contactDescription: "Whether it's about a project, collaboration, or a professional opportunity, feel free to reach out.",
  githubUrl: "https://github.com/pritum120753", linkedinUrl: "https://www.linkedin.com/in/pritum-s-29ba582b9b4/",
  footerName: "Pritum Kumar Shill", footerDescription: "Building ideas into digital experiences.",
  footerCopyright: "All rights reserved.", githubUsername: "pritum120753", showGithubRepos: true,
};
const stringFields = Object.keys(defaults).filter((key) => key !== "id" && key !== "showGithubRepos");

export async function getSiteSettings(req, res, next) {
  try {
    const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, update: {}, create: defaults });
    res.json({ success: true, settings });
  } catch (error) { next(error); }
}

export async function updateSiteSettings(req, res, next) {
  try {
    const data = {};
    for (const field of stringFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string") return res.status(400).json({ success: false, message: `${field} must be a string` });
        data[field] = req.body[field].trim();
      }
    }
    if (req.body.showGithubRepos !== undefined) {
      if (typeof req.body.showGithubRepos !== "boolean") return res.status(400).json({ success: false, message: "showGithubRepos must be a boolean" });
      data.showGithubRepos = req.body.showGithubRepos;
    }
    const settings = await prisma.siteSettings.upsert({ where: { id: "main" }, update: data, create: { ...defaults, ...data } });
    res.json({ success: true, message: "Site settings updated successfully", settings });
  } catch (error) { next(error); }
}
