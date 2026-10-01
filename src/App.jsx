import { motion } from "framer-motion"
import { Typewriter } from "react-simple-typewriter"
import { useEffect, useState } from "react"
import Tilt from "react-parallax-tilt"
import StarBackground from "./StarBackground"
import ContactForm from "./ContactForm"
import { appraisalSkills, experience, education } from "./data"

function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(true)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [githubProjects, setGithubProjects] = useState([])
  const [githubLoading, setGithubLoading] = useState(true)
  const [githubError, setGithubError] = useState("")

  // SCROLL PROGRESS
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const progress =
        totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0
      setScrollProgress(progress)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // LOAD PUBLIC GITHUB REPOSITORIES
  useEffect(() => {
    const loadGitHubProjects = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/users/pritum120753/repos?per_page=100&sort=updated"
        )
        if (!response.ok) throw new Error("GitHub API request failed")

        const repos = await response.json()
        const visibleRepos = repos
          .filter((repo) => !repo.fork && !repo.archived)
          .map((repo) => ({
            id: repo.id,
            title: repo.name,
            description: repo.description || "No description available",
            language: repo.language || "Code",
            github: repo.html_url,
            homepage: repo.homepage || "",
            stars: repo.stargazers_count,
            updated: repo.updated_at,
          }))

        setGithubProjects(visibleRepos)
      } catch (error) {
        setGithubError("GitHub projects could not be loaded right now.")
      } finally {
        setGithubLoading(false)
      }
    }

    loadGitHubProjects()
  }, [])

  // CURSOR GLOW
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursor({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-500 ${
        darkMode ? "bg-black text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <StarBackground />

      {/* CURSOR GLOW */}
      <div
        className="pointer-events-none fixed z-10 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"
        style={{ left: cursor.x - 96, top: cursor.y - 96 }}
      />

      {/* SCROLL PROGRESS */}
      <div
        className="fixed left-0 top-0 z-[100] h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* NAVBAR */}
      <nav
        className={`fixed left-1/2 top-5 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border px-5 py-3 backdrop-blur-xl ${
          darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70"
        }`}
      >
        <a href="#about" className="hidden transition hover:text-blue-400 sm:block">About</a>
        <a href="#skills" className="hidden transition hover:text-blue-400 sm:block">Skills</a>
        <a href="#appraisal" className="hidden transition hover:text-blue-400 sm:block">Appraisal</a>
        <a href="#projects" className="hidden transition hover:text-blue-400 sm:block">Projects</a>
        <a href="#timeline" className="hidden transition hover:text-blue-400 sm:block">Journey</a>
        <a href="#contact" className="hidden transition hover:text-blue-400 sm:block">Contact</a>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-full border border-white/20 px-3 py-1 text-sm transition hover:scale-105"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="mb-6"
        >
          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-2 text-sm text-blue-300">
            👋 Welcome to my digital space
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-5xl text-5xl font-extrabold leading-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Pritum Kumar Shill
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className={`mt-6 text-xl md:text-2xl ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          <Typewriter
            words={[
              "Computer Science Student",
              "Full Stack Developer",
              "AI Enthusiast",
              "Data Science Explorer",
              "Future Tech Professional 🚀",
            ]}
            loop={true}
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
          transition={{ delay: 1.2, duration: 0.8 }}
          className={`mt-6 max-w-2xl text-base md:text-lg ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Building modern digital experiences, exploring AI and
          transforming ideas into real-world applications.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <motion.a
            href="#projects"
            whileHover={{ scale: 1.08, boxShadow: "0 0 35px rgba(59,130,246,0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-semibold"
          >
            Explore My Work 🚀
          </motion.a>

          <motion.a
            href="/resume.pdf"
            download
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="rounded-full border border-white/20 px-8 py-3 font-semibold backdrop-blur-md"
          >
            📄 Download Resume
          </motion.a>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 text-2xl"
        >
          ↓
        </motion.div>
      </section>

      {/* ABOUT */}
      <Section id="about" title="About Me">
        <div className="mx-auto max-w-3xl">
          <p className="leading-8">
            Detail-oriented Appraisal Report Assistant with 3+ years of experience supporting U.S.-based residential appraisal firms. Alongside my professional valuation work, I am a Computer Science student with a strong foundation in data analysis, software development, and scalable system design.
          </p>
          <p className="mt-5 leading-8">
            I combine analytical thinking with technical skills to build efficient, accurate, and modern solutions. I enjoy learning new technologies and applying them to practical, real-world problems.
          </p>
        </div>
      </Section>

      {/* REAL ESTATE APPRAISAL */}
      <Section id="appraisal" title="Real Estate Appraisal">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {appraisalSkills.map((skill, index) => (
            index === 0 ? (
              <motion.a
                key={skill}
                href="/sample-report.pdf"
                download="sample-report.pdf"
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 font-semibold text-white transition"
              >
                {skill}
              </motion.a>
            ) : (
              <motion.div
                key={skill}
                whileHover={{ scale: 1.05, y: -4 }}
                className={`rounded-2xl border p-6 font-semibold backdrop-blur-xl ${
                  darkMode
                    ? "border-white/10 bg-white/5"
                    : "border-black/10 bg-white/70"
                }`}
              >
                {skill}
              </motion.div>
            )
          ))}
        </div>
      </Section>

      {/* SKILLS */}
      <Section id="skills" title="Tech Stack">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            "React",
            "JavaScript",
            "Tailwind CSS",
            "Node.js",
            "Python",
            "C++",
            "SQL",
            "Git",
            "Machine Learning",
            "Data Science",
            "HTML",
            "CSS",
          ].map((skill) => (
            <motion.div
              key={skill}
              whileHover={{ scale: 1.08, y: -5 }}
              className={`rounded-2xl border p-6 font-semibold backdrop-blur-xl ${
                darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white/70"
              }`}
            >
              {skill}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* PROJECTS */}
      <Section id="projects" title="GitHub Projects">
        <div className="mb-8">
          <p className="mx-auto max-w-2xl text-gray-400">
            My public GitHub repositories are connected directly to this portfolio. New public repositories will appear here automatically.
          </p>
        </div>

        {githubLoading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-gray-400">
            Loading GitHub repositories...
          </div>
        )}

        {!githubLoading && githubError && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-red-300">
            {githubError} Visit my GitHub profile directly:
            <a
              href="https://github.com/pritum120753"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 underline"
            >
              github.com/pritum120753
            </a>
          </div>
        )}

        {!githubLoading && !githubError && githubProjects.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-gray-400">
            No public repositories found yet.
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {githubProjects.map((p) => (
            <Tilt
              key={p.id}
              glareEnable={true}
              glareMaxOpacity={0.2}
              scale={1.02}
              tiltMaxAngleX={8}
              tiltMaxAngleY={8}
              className="h-full"
            >
              <div
                className={`flex h-full flex-col overflow-hidden rounded-2xl border text-left ${
                  darkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-white"
                }`}
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/30">
                  <span className="text-5xl">💻</span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-2 break-words text-xl font-bold">{p.title}</h3>
                  <p className="mb-4 flex-1 text-sm text-gray-400">{p.description}</p>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                      {p.language}
                    </span>
                    {p.stars > 0 && (
                      <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                        ★ {p.stars}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 font-semibold text-white"
                    >
                      View on GitHub ↗
                    </a>
                    {p.homepage && (
                      <a
                        href={p.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/20 px-4 py-2 font-semibold"
                      >
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Tilt>
          ))}
        </div>
      </Section>

      {/* TIMELINE */}
      <Section id="timeline" title="Experience & Education">
        <div className="grid gap-12 text-left md:grid-cols-2">
          <Timeline title="💼 Experience" items={experience} darkMode={darkMode} />
          <Timeline title="🎓 Education" items={education} darkMode={darkMode} />
        </div>
      </Section>

      {/* CONTACT */}
      <Section id="contact" title="Let's Connect">
        <p className="mb-8 text-gray-400">
          Have an idea, project or opportunity? Send me a message.
        </p>

        <ContactForm darkMode={darkMode} />

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="https://github.com/pritum120753"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 px-6 py-3 transition hover:scale-105 hover:bg-white hover:text-black"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/pritum-s-29ba582b9b4/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 px-6 py-3 transition hover:scale-105 hover:bg-white hover:text-black"
          >
            LinkedIn
          </a>
          <a
            href="mailto:pritumshill25@gmail.com"
            className="rounded-full border border-white/20 px-6 py-3 transition hover:scale-105 hover:bg-white hover:text-black"
          >
            Email
          </a>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Pritum Kumar Shill</p>
        <p className="mt-2">Built with React + Tailwind + Framer Motion 🚀</p>
      </footer>
    </div>
  )
}

function Timeline({ title, items, darkMode }) {
  return (
    <div>
      <h3 className="mb-6 text-2xl font-bold text-white">{title}</h3>
      <div className="relative ml-3 border-l border-blue-400/30 pl-8">
        {items.map((item) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mb-10 last:mb-0"
          >
            <span className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 ring-4 ring-black/40" />
            <p className="text-sm text-blue-300">{item.period}</p>
            <h4 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
              {item.title}
            </h4>
            <p className="text-sm text-gray-400">{item.org}</p>
            {item.points && (
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-400">
                {item.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children, id }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, amount: 0.2 }}
      className="relative mx-auto max-w-6xl px-6 py-28 text-center"
    >
      <h2 className="mb-14 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
        {title}
      </h2>

      <div className="text-lg text-gray-400">{children}</div>
    </motion.section>
  )
}

export default App
