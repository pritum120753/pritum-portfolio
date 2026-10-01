import { useState } from "react"

// Works with Netlify Forms (no backend needed). Only works after deploying on Netlify.
export default function ContactForm({ darkMode }) {
  const [data, setData] = useState({ name: "", email: "", message: "" })
  const [status, setStatus] = useState("idle") // idle | sending | success | error

  const handleChange = (e) =>
    setData({ ...data, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("sending")

    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "contact", ...data }).toString(),
      })

      if (!res.ok) throw new Error("Failed")

      setStatus("success")
      setData({ name: "", email: "", message: "" })
    } catch {
      setStatus("error")
    }
  }

  const field = `w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-blue-400 ${
    darkMode
      ? "border-white/10 bg-white/5 text-white placeholder-gray-500"
      : "border-black/10 bg-white text-slate-900 placeholder-gray-400"
  }`

  return (
    <form
      name="contact"
      method="POST"
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-4 text-left"
    >
      <input type="hidden" name="form-name" value="contact" />

      <input
        name="name"
        value={data.name}
        onChange={handleChange}
        placeholder="Your name"
        required
        className={field}
      />

      <input
        name="email"
        type="email"
        value={data.email}
        onChange={handleChange}
        placeholder="Your email"
        required
        className={field}
      />

      <textarea
        name="message"
        value={data.message}
        onChange={handleChange}
        placeholder="Your message"
        rows={5}
        required
        className={field}
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send Message 🚀"}
      </button>

      {status === "success" && (
        <p className="text-center text-green-400">Message sent! I'll get back to you soon.</p>
      )}
      {status === "error" && (
        <p className="text-center text-red-400">
          Could not send. Please email me directly instead.
        </p>
      )}
    </form>
  )
}
