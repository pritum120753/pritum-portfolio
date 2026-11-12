const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;

function validateName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name && name.length <= 80 ? name : null;
}

function validateEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

function validatePassword(value) {
  return typeof value === "string" &&
    value.length >= MIN_PASSWORD_LENGTH &&
    value.length <= MAX_PASSWORD_LENGTH;
}

export function validateAdminCreateInput(body) {
  const name = validateName(body?.name);
  const email = validateEmail(body?.email);
  const password = body?.password;

  if (!name) return { valid: false, message: "A valid name is required (maximum 80 characters)" };
  if (!email) return { valid: false, message: "A valid email address is required" };
  if (!validatePassword(password)) {
    return { valid: false, message: "Password must be between 12 and 128 characters" };
  }

  return { valid: true, data: { name, email, password } };
}

export function validateAdminUpdateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, message: "A valid update payload is required" };
  }

  const data = {};

  if (Object.hasOwn(body, "name")) {
    const name = validateName(body.name);
    if (!name) return { valid: false, message: "A valid name is required (maximum 80 characters)" };
    data.name = name;
  }

  if (Object.hasOwn(body, "email")) {
    const email = validateEmail(body.email);
    if (!email) return { valid: false, message: "A valid email address is required" };
    data.email = email;
  }

  if (Object.hasOwn(body, "password") && body.password !== "") {
    if (!validatePassword(body.password)) {
      return { valid: false, message: "Password must be between 12 and 128 characters" };
    }
    data.password = body.password;
  } else if (Object.hasOwn(body, "password") && typeof body.password !== "string") {
    return { valid: false, message: "Password must be text" };
  }

  if (Object.keys(data).length === 0) {
    return { valid: false, message: "Provide at least one valid field to update" };
  }

  return { valid: true, data };
}

export function getAdminDeletionError({ actorId, targetId, adminCount }) {
  if (actorId === targetId) return "You cannot delete your own admin account";
  if (adminCount <= 1) return "At least one admin account must remain";
  return null;
}
