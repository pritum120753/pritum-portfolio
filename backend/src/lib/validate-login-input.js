const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(body) {
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password =
    typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return { valid: false, message: "Email and password are required" };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { valid: false, message: "A valid email address is required" };
  }

  if (password.length > 128) {
    return { valid: false, message: "Password is too long" };
  }

  return { valid: true, email, password };
}
