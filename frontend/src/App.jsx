import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";
import { useEffect, useState } from "react";
import StarBackground from "./StarBackground";
import ContactForm from "./ContactForm";
import { appraisalSkills } from "./data";
import { apiRequest } from "./services/api";

function getCollection(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [educationItems, setEducationItems] = useState([]);
  const [about, setAbout] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress =
        totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSiteSettings = async () => {
      try {
        // Always request the latest settings first; do not render stale local data.
        const response = await apiRequest("/site-settings", { cache: "no-store" });
        const settings = response?.settings;

        if (!settings || typeof settings !== "object") {
          throw new Error("The latest website settings were not returned by the API.");
        }

        if (!active) return;
        setSiteSettings(settings);

        try {
          localStorage.setItem("portfolio_site_settings_v1", JSON.stringify(settings));
        } catch {
          // Keep the page working if browser storage is unavailable.
        }
      } catch (error) {
        console.warn("Latest site settings could not be loaded; using cached settings as a fallback.", error);

        // Cached settings are used only when the live API request fails.
        if (active) {
          try {
            const cached = localStorage.getItem("portfolio_site_settings_v1");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed === "object") {
                setSiteSettings(parsed);
              }
            }
          } catch {
            // Continue with the built-in defaults if cached data is unavailable or invalid.
          }
        }
      } finally {
      }
    };

    loadSiteSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPortfolioData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const [
  projectResponse,
  skillResponse,
  experienceResponse,
  educationResponse,
  aboutResponse,
] = await Promise.all([
  apiRequest("/projects"),
  apiRequest("/skills"),
  apiRequest("/experiences"),
  apiRequest("/education"),
  apiRequest("/about"),
]);

        if (!active) return;
        setAbout(aboutResponse.about);

        const projectItems = getCollection(
          projectResponse,
          "projects"
        );

        const skillItems = getCollection(
          skillResponse,
          "skills"
        );

        const experienceItems = getCollection(
          experienceResponse,
          "experiences"
        );

        const educationRecords = getCollection(
          educationResponse,
          "education"
        );

        setProjects(
          projectItems
            .filter(
              (item) =>
                item.isPublished !== false &&
                item.published !== false
            )
            .sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0)
            )
        );

        setSkills(
          skillItems
            .filter(
              (item) =>
                item.isPublished !== false &&
                item.published !== false
            )
            .sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0)
            )
        );

        setExperiences(
          experienceItems
            .filter(
              (item) =>
                item.isPublished !== false &&
                item.published !== false
            )
            .sort(
              (a, b) =>
                new Date(b.startDate || 0) -
                new Date(a.startDate || 0)
            )
        );

        setEducationItems(
          educationRecords
            .filter(
              (item) =>
                item.isPublished !== false &&
                item.published !== false
            )
            .sort(
              (a, b) =>
                new Date(b.startDate || 0) -
                new Date(a.startDate || 0)
            )
        );
      } catch (error) {
        if (active) {
          setDataError(
            error.message ||
              "Portfolio information could not be loaded."
          );
        }
      } finally {
        if (active) setDataLoading(false);
      }
    };

    loadPortfolioData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const username = siteSettings?.githubUsername?.trim();
    if (!siteSettings?.showGithubRepos || !username) { setGithubRepos([]); return; }
    let active = true;
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=12&type=public`)
      .then((response) => { if (!response.ok) throw new Error("GitHub repositories could not be loaded."); return response.json(); })
      .then((items) => { if (active && Array.isArray(items)) setGithubRepos(items.filter((repo) => !repo.fork)); })
      .catch((error) => console.error(error));
    return () => { active = false; };
  }, [siteSettings?.githubUsername, siteSettings?.showGithubRepos]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setCursor({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () =>
      window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const timelineExperience = experiences.map((item) => ({
    id: item.id,
    period: `${formatDate(item.startDate)} – ${
      item.current
        ? "Present"
        : formatDate(item.endDate) || "Present"
    }`,
    title: item.position || item.title || "Position",
    org: item.company || item.organization || "",
    description: item.description || "",
  }));

  const timelineEducation = educationItems.map((item) => ({
    id: item.id,
    period: `${formatDate(item.startDate)} – ${formatDate(
      item.endDate
    )}`,
    title: item.degree || item.title || "Education",
    org: [item.institution, item.field]
      .filter(Boolean)
      .join(" • "),
    description: item.description || "",
  }));

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${
        darkMode
          ? "bg-black text-white"
          : "bg-slate-100 text-slate-900"
      }`}
    >
      <StarBackground />

      <div
        className="pointer-events-none fixed z-10 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"
        style={{
          left: cursor.x - 96,
          top: cursor.y - 96,
        }}
      />

      <div
        className="fixed left-0 top-0 z-[100] h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        style={{ width: `${scrollProgress}%` }}
      />

      <nav
        className={`fixed left-1/2 top-5 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border px-5 py-3 backdrop-blur-xl ${
          darkMode
            ? "border-white/10 bg-white/5"
            : "border-black/10 bg-white/70"
        }`}
      >
        <a href="#about" className="hidden transition hover:text-blue-400 sm:block">
          About
        </a>

        <a href="#skills" className="hidden transition hover:text-blue-400 sm:block">
          Skills
        </a>

        <a href="#appraisal" className="hidden transition hover:text-blue-400 sm:block">
          Appraisal
        </a>

        <a href="#projects" className="hidden transition hover:text-blue-400 sm:block">
          Projects
        </a>

        <a href="#github-projects" className="hidden transition hover:text-blue-400 sm:block">
          GitHub
        </a>

        <a href="#timeline" className="hidden transition hover:text-blue-400 sm:block">
          Journey
        </a>

        <a href="#contact" className="hidden transition hover:text-blue-400 sm:block">
          Contact
        </a>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full border border-white/20 px-3 py-1 text-sm transition hover:scale-105"
          aria-label="Toggle color theme"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </nav>

      {/* HERO SECTION */}

      <style>{`
        .portfolio-hero-section {
          min-height: 680px;
          padding: 130px 5vw 90px;
          display: flex;
          align-items: center;
          box-sizing: border-box;
        }

        .portfolio-hero-layout {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr);
          align-items: center;
          gap: 56px;
        }

        .portfolio-hero-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .portfolio-hero-copy h1 {
          font-size: clamp(2.6rem, 4.2vw, 3.8rem);
          line-height: 1.08;
        }

        .portfolio-hero-copy p {
          max-width: 600px;
        }

        .portfolio-hero-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        .portfolio-hero-avatar {
          width: min(280px, 72vw);
          height: min(280px, 72vw);
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid rgba(96,165,250,.8);
          background: #e5e7eb;
          box-shadow: 0 0 55px rgba(59,130,246,.25);
        }

        .portfolio-hero-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .portfolio-hero-badges {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 22px;
          max-width: 390px;
        }

        @media (max-width: 850px) {
          .portfolio-hero-section {
            min-height: auto;
            padding: 125px 22px 90px;
          }

          .portfolio-hero-layout {
            grid-template-columns: 1fr;
            gap: 38px;
          }

          .portfolio-hero-copy {
            align-items: center;
            text-align: center;
          }

          .portfolio-hero-copy p {
            margin-left: auto;
            margin-right: auto;
          }

          .portfolio-hero-visual {
            grid-row: 2;
          }

          #about .about-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section className="portfolio-hero-section relative mx-auto w-full max-w-7xl overflow-hidden">
        <div className="portfolio-hero-layout">

          <div className="portfolio-hero-copy relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-6"
            >
              <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm text-blue-300">
                {siteSettings?.heroBadge || "👋 Welcome to my digital space"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                {siteSettings?.heroName || "Pritum Kumar Shill"}
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`mt-5 text-xl md:text-2xl ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <Typewriter
                words={(siteSettings?.heroTitles || "Computer Science Student\nFull Stack Developer\nAI Enthusiast\nData Science Explorer\nFuture Tech Professional 🚀").split("\n").map((item) => item.trim()).filter(Boolean)}
                loop
                cursor
                cursorStyle="|"
                typeSpeed={60}
                deleteSpeed={40}
                delaySpeed={1400}
              />
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className={`mt-6 max-w-xl text-base leading-7 md:text-lg ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {siteSettings?.heroDescription || "Building modern digital experiences, exploring AI and transforming ideas into real-world applications."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start"
            >
              <motion.a
                href={siteSettings?.heroPrimaryUrl || "#projects"}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/20"
              >
                {siteSettings?.heroPrimaryText || "Explore My Work 🚀"}
              </motion.a>

              <motion.a
                href={siteSettings?.heroResumeUrl || "/resume.pdf"}
                download
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-full border border-white/20 px-8 py-3 font-semibold text-white transition hover:border-blue-400/60"
              >
                {siteSettings?.heroResumeText || "📄 Download Resume"}
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start"
            >
              <a
                href={siteSettings?.githubUrl || "https://github.com/pritum120753"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:border-blue-400/50"
              >
                GitHub ↗
              </a>

              <a
                href={siteSettings?.linkedinUrl || "https://www.linkedin.com/in/pritum-s-29ba582b9b4/"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:border-blue-400/50"
              >
                LinkedIn ↗
              </a>

              <a
                href={`mailto:${siteSettings?.email || "pritumshill25@gmail.com"}`}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:border-blue-400/50"
              >
                Email ✉
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="portfolio-hero-visual relative"
          >
            <div className="absolute h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="portfolio-hero-avatar relative z-10">
              <img
                src={siteSettings?.heroImage || "/profile-placeholder.png"}
                alt={siteSettings?.heroName || "Profile photo"}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            <div className="portfolio-hero-badges relative z-10">
              {(siteSettings?.heroBadges || "Web Development\nData Analysis\nReal Estate Appraisal\nAI Tools").split("\n").map((badge) => badge.trim()).filter(Boolean).map((badge) => (
                <span key={badge} className="rounded-full border border-blue-400/30 bg-slate-950/80 px-3 py-2 text-xs font-medium text-blue-100">{badge}</span>
              ))}
            </div>
          </motion.div>

        </div>
      </section>
      {/* ABOUT SECTION */}

      
<Section id="about" title="About Me">
  <div className="about-layout mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.35fr_.85fr]">

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative overflow-hidden rounded-3xl border p-7 text-left sm:p-9 ${
        darkMode
          ? "border-white/10 bg-gradient-to-br from-slate-900/90 to-blue-950/40"
          : "border-slate-200 bg-white shadow-xl"
      }`}
    >
      <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
        {about?.badge || "Who I Am"}
      </span>

      <h3 className="mb-5 mt-5 text-2xl font-bold sm:text-3xl">
        {about?.heading || "Analytical mindset. Technical creativity."}
      </h3>

      <p className="text-base leading-8 text-slate-400">
        {about?.description || "Detail-oriented Appraisal Report Assistant with 3+ years of experience supporting U.S.-based residential appraisal firms. Alongside my professional valuation work, I am a Computer Science student with a strong foundation in data analysis, software development, and scalable system design."}
      </p>

      <p className="mt-4 text-base leading-8 text-slate-400">
        {about?.additionalText || "I combine analytical thinking with technical skills to build efficient, accurate, and modern solutions. I enjoy learning new technologies and applying them to practical, real-world problems."}
      </p>
    </motion.div>

    <div className="grid grid-cols-1 gap-4">
      {[
        {
          number: about?.experienceValue || "3+ Years",
          title: about?.experienceTitle || "Professional Experience",
          detail: about?.experienceSubtitle || "Supporting U.S. residential appraisal firms",
          icon: "▣",
        },
        {
          number: about?.academicValue || "Computer Science",
          title: about?.academicTitle || "Academic Focus",
          detail: about?.academicSubtitle || "Software development and system design",
          icon: "⌘",
        },
        {
          number: about?.interestsValue || "Data + Technology",
          title: about?.interestsTitle || "Core Interests",
          detail: about?.interestsSubtitle || "Turning analysis into practical solutions",
          icon: "✦",
        },
      ].map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, x: 18 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.08 }}
          whileHover={{ y: -4 }}
          className={`flex items-start gap-4 rounded-2xl border p-5 ${
            darkMode
              ? "border-white/10 bg-white/[0.04] hover:border-blue-400/40"
              : "border-slate-200 bg-white shadow-md hover:border-blue-300"
          }`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-xl text-blue-300">
            {item.icon}
          </span>

          <div>
            <div className="text-lg font-bold text-blue-300">
              {item.number}
            </div>
            <h4 className="mt-1 font-semibold">{item.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {item.detail}
            </p>
          </div>
        </motion.div>
      ))}
    </div>

  </div>
</Section>


     {/* REAL ESTATE APPRAISAL */}

<Section id="appraisal" title="Real Estate Appraisal">
  <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
    {appraisalSkills.map((skill, index) => (
      index === 0 ? (
        <a
          key={skill}
          href="/sample-report.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-20 block cursor-pointer rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 font-semibold text-white transition hover:scale-105"
        >
          {skill}
          <span className="mt-2 block text-xs font-normal">
            Click to view sample PDF ↗
          </span>
        </a>
      ) : (
        <div
          key={skill}
          className={`rounded-2xl border p-6 font-semibold backdrop-blur-xl ${
            darkMode
              ? "border-white/10 bg-white/5"
              : "border-black/10 bg-white/70"
          }`}
        >
          {skill}
        </div>
      )
    ))}
  </div>
</Section>

      {/* TECHNICAL SKILLS */}

      <Section id="skills" title="Technical Skills">
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-7 text-slate-400 sm:text-base">
          Technologies and tools I use to build, analyze, and deliver
          practical solutions.
        </p>

        {dataLoading ? (
          <LoadingMessage darkMode={darkMode} />
        ) : dataError ? (
          <ErrorMessage message={dataError} />
        ) : skills.length === 0 ? (
          <EmptyMessage
            message="Skills will appear here once added from the admin dashboard."
            darkMode={darkMode}
          />
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill, index) => {
              const level =
                skill.level == null
                  ? null
                  : Math.min(
                      100,
                      Math.max(0, Number(skill.level) || 0)
                    );

              return (
                <motion.div
                  key={skill.id || skill.name}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.45,
                    delay: (index % 6) * 0.06,
                  }}
                  whileHover={{ y: -6, scale: 1.015 }}
                  className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition ${
                    darkMode
                      ? "border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-900/40 hover:border-blue-400/40"
                      : "border-slate-200 bg-white shadow-md hover:border-blue-300"
                  }`}
                >
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-lg font-bold text-blue-300">
                      {(skill.name || "S").trim().charAt(0).toUpperCase()}
                    </div>

                    {skill.category && (
                      <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                        {skill.category}
                      </span>
                    )}
                  </div>

                  <h3 className="relative mt-5 text-lg font-bold">
                    {skill.name}
                  </h3>

                  {level !== null && (
                    <div className="relative mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Proficiency</span>
                        <span>{level}%</span>
                      </div>

                      <div className={`h-2 overflow-hidden rounded-full ${
                        darkMode ? "bg-white/10" : "bg-slate-100"
                      }`}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${level}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9 }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>

      {/* PROJECTS SECTION */}

      <Section id="projects" title="Featured Projects">
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-7 text-slate-400 sm:text-base">
          A selection of projects showcasing my work in development,
          data, and technology.
        </p>

        {dataLoading ? (
          <LoadingMessage darkMode={darkMode} />
        ) : dataError ? (
          <ErrorMessage message={dataError} />
        ) : projects.length === 0 ? (
          <div className={`mx-auto max-w-3xl rounded-3xl border p-10 text-center ${
            darkMode
              ? "border-white/10 bg-slate-900/80"
              : "border-slate-200 bg-white shadow-lg"
          }`}>
            <div className="mx-auto mb-5 text-5xl">🚀</div>
            <h3 className="text-xl font-bold">
              Projects are coming soon
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              I’m preparing projects to showcase here.
              Check back soon to explore my work.
            </p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-7 text-left md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => {
              const technologies = Array.isArray(project.technologies)
                ? project.technologies
                : typeof project.technologies === "string"
                  ? project.technologies
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                  : [];

              return (
                <motion.article
                  key={project.id || project.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
                  whileHover={{ y: -7 }}
                  className={`group flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
                    darkMode
                      ? "border-white/10 bg-slate-900/60 hover:border-blue-400/40"
                      : "border-slate-200 bg-white shadow-lg hover:border-blue-300"
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/30">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title || "Project preview"}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-6xl opacity-80">💻</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                    <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-white">
                      Project {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold tracking-tight">
                      {project.title}
                    </h3>

                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-400">
                      {project.description ||
                        "A project demonstrating practical problem-solving and technical skills."}
                    </p>

                    {technologies.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {technologies.map((technology) => (
                          <span
                            key={technology}
                            className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          GitHub ↗
                        </a>
                      )}

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:border-blue-400/50"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </Section>
      {siteSettings?.showGithubRepos && githubRepos.length > 0 && <Section id="github-projects" title="Latest GitHub Repositories">
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-7 text-slate-400">Public repositories are automatically synced from GitHub.</p>
        <div className="mx-auto grid max-w-6xl gap-6 text-left md:grid-cols-2 xl:grid-cols-3">
          {githubRepos.map((repo) => <motion.article key={repo.id} whileHover={{ y: -5 }} className={`rounded-2xl border p-6 ${darkMode ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white shadow"}`}>
            <h3 className="text-lg font-bold">{repo.name}</h3>
            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{repo.description || "Public GitHub repository."}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400"><span>★ {repo.stargazers_count}</span><span>⑂ {repo.forks_count} forks</span>{repo.language && <span>{repo.language}</span>}</div>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-xl border border-blue-400/30 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10">View Repository ↗</a>
          </motion.article>)}
        </div>
      </Section>}

      {/* EXPERIENCE & EDUCATION */}

      <Section id="timeline" title="My Journey">
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-7 text-slate-400 sm:text-base">
          My professional experience and academic journey, bringing
          together business knowledge and technology.
        </p>

        {dataLoading ? (
          <LoadingMessage darkMode={darkMode} />
        ) : dataError ? (
          <ErrorMessage message={dataError} />
        ) : (
          <div className="mx-auto grid max-w-6xl gap-8 text-left lg:grid-cols-2">
            <Timeline
              title="Professional Experience"
              subtitle="Where I have applied my skills"
              icon="💼"
              items={timelineExperience}
              darkMode={darkMode}
            />

            <Timeline
              title="Education"
              subtitle="What I have learned"
              icon="🎓"
              items={timelineEducation}
              darkMode={darkMode}
            />
          </div>
        )}
      </Section>

      {/* CONTACT SECTION */}

      <Section id="contact" title="Let's Connect">
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-7 text-slate-400 sm:text-base">
          Have an idea, project, or opportunity? I would be happy
          to hear from you. Send a message and let's start a conversation.
        </p>

        <div className="mx-auto grid max-w-6xl gap-7 text-left lg:grid-cols-[0.8fr_1.2fr]">

          {/* Contact Information */}

          <div className={`relative overflow-hidden rounded-3xl border p-7 sm:p-8 ${
            darkMode
              ? "border-white/10 bg-gradient-to-br from-slate-900/90 to-blue-950/30"
              : "border-slate-200 bg-white shadow-lg"
          }`}>
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-2xl">
                ✉️
              </div>

              <h3 className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-slate-900"
              }`}>
                Get in touch
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {siteSettings?.contactDescription || "Whether it's about a project, collaboration, or a professional opportunity, feel free to reach out."}
              </p>

              <a
                href={`mailto:${siteSettings?.email || "pritumshill25@gmail.com"}`}
                className="mt-7 flex items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4 transition hover:border-blue-400/50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                  ✉
                </span>

                <span className="min-w-0">
                  <span className="block text-xs text-slate-400">
                    Email me
                  </span>
                  <span className="block break-all text-sm font-semibold text-blue-300">
                    {siteSettings?.email || "pritumshill25@gmail.com"}
                  </span>
                </span>
              </a>

              {(siteSettings?.phone || siteSettings?.location) && <div className="mt-4 space-y-2 text-sm text-slate-300">
                {siteSettings?.phone && <p>☎ {siteSettings.phone}</p>}
                {siteSettings?.location && <p>⌖ {siteSettings.location}</p>}
              </div>}

              <div className="mt-7">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Find me online
                </p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={siteSettings?.githubUrl || "https://github.com/pritum120753"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:border-blue-400/50 hover:text-blue-300"
                  >
                    GitHub ↗
                  </a>

                  <a
                    href={siteSettings?.linkedinUrl || "https://www.linkedin.com/in/pritum-s-29ba582b9b4/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:border-blue-400/50 hover:text-blue-300"
                  >
                    LinkedIn ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}

          <div className={`rounded-3xl border p-6 sm:p-8 ${
            darkMode
              ? "border-white/10 bg-slate-900/60"
              : "border-slate-200 bg-white shadow-lg"
          }`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-slate-900"
              }`}>
                Send a message
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                I'll get back to you as soon as I can.
              </p>
            </div>

            <ContactForm darkMode={darkMode} />
          </div>

        </div>
      </Section>

      {/* FOOTER */}

      <footer className={`border-t py-10 text-center ${
        darkMode
          ? "border-white/10 bg-slate-950/50"
          : "border-slate-200 bg-white"
      }`}>
        <h3 className="text-xl font-bold">
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {siteSettings?.footerName || siteSettings?.heroName || "Pritum Kumar Shill"}
          </span>
        </h3>

        <p className="mt-3 text-sm text-slate-400">
          {siteSettings?.footerDescription || "Building ideas into digital experiences."}
        </p>

        <div className="mt-5 flex justify-center gap-5 text-sm text-slate-400">
          <a href={siteSettings?.githubUrl || "https://github.com/pritum120753"} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
            GitHub
          </a>

          <a href={siteSettings?.linkedinUrl || "https://www.linkedin.com/in/pritum-s-29ba582b9b4/"} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
            LinkedIn
          </a>

          <a href={`mailto:${siteSettings?.email || "pritumshill25@gmail.com"}`} className="hover:text-blue-400">
            Email
          </a>
        </div>

        <p className="mt-7 text-xs text-slate-500">
          © {new Date().getFullYear()} {siteSettings?.footerName || siteSettings?.heroName || "Pritum Kumar Shill"}. {siteSettings?.footerCopyright || "All rights reserved."}
        </p>

        <p className="mt-2 text-xs text-slate-600">
          Built with React, Tailwind CSS & Framer Motion 🚀
        </p>

        
      </footer>

    </div>
  );
}


/* TIMELINE COMPONENT */

function Timeline({ title, subtitle, icon, items, darkMode }) {
  const panelClass = darkMode
    ? "border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-900/40"
    : "border-slate-200 bg-white shadow-lg";

  return (
    <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${panelClass}`}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-2xl">
          {icon}
        </div>

        <div>
          <h3 className={`text-xl font-bold sm:text-2xl ${
            darkMode ? "text-white" : "text-slate-900"
          }`}>
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blue-400/25 bg-blue-500/[0.04] px-5 py-9 text-center">
          <div className="mb-3 text-3xl">{icon}</div>

          <p className={`font-semibold ${
            darkMode ? "text-slate-200" : "text-slate-700"
          }`}>
            More updates coming soon
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Add your {title.toLowerCase()} details from the admin dashboard.
          </p>
        </div>
      ) : (
        <div className="relative ml-2 border-l border-blue-400/30 pl-7">
          {items.map((item, index) => (
            <motion.article
              key={item.id || `${item.title}-${item.org}`}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="relative mb-7 last:mb-0"
            >
              <span className="absolute -left-[35px] top-1 h-4 w-4 rounded-full border-2 border-blue-300 bg-slate-950 shadow-[0_0_14px_rgba(59,130,246,0.55)]" />

              <div className={`rounded-2xl border p-5 transition hover:-translate-y-1 ${
                darkMode
                  ? "border-white/10 bg-white/[0.035] hover:border-blue-400/35"
                  : "border-slate-200 bg-slate-50 hover:border-blue-300"
              }`}>
                {item.period && (
                  <span className="inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                    {item.period}
                  </span>
                )}

                <h4 className={`mt-3 text-lg font-bold ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}>
                  {item.title}
                </h4>

                {item.org && (
                  <p className="mt-1 text-sm font-medium text-blue-300">
                    {item.org}
                  </p>
                )}

                {item.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}


/* LOADING COMPONENT */

function LoadingMessage({ darkMode }) {
  return (
    <div className={`rounded-2xl border p-8 ${
      darkMode
        ? "border-white/10 bg-white/5 text-gray-400"
        : "border-black/10 bg-white text-gray-600"
    }`}>
      Loading portfolio information...
    </div>
  );
}


/* EMPTY STATE */

function EmptyMessage({ message, darkMode }) {
  return (
    <div className={`rounded-2xl border p-8 ${
      darkMode
        ? "border-white/10 bg-white/5 text-gray-400"
        : "border-black/10 bg-white text-gray-600"
    }`}>
      {message}
    </div>
  );
}


/* ERROR COMPONENT */

function ErrorMessage({ message }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-300">
      {message}
    </div>
  );
}


/* REUSABLE SECTION */

function Section({ title, children, id }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true, amount: 0.1 }}
      className="relative mx-auto max-w-6xl px-6 py-24 text-center"
    >
      <h2 className="mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
        {title}
      </h2>

      <div className="text-lg text-gray-400">
        {children}
      </div>
    </motion.section>
  );
}


export default App;