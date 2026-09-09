export const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || '').trim());

/** Accepts 08012345678, +2348012345678, 2348012345678. */
export const isPhone = (v) => /^(\+?234|0)[789]\d{9}$/.test((v || '').replace(/[\s-]/g, ''));

export function passwordProblem(v) {
  if (!v || v.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number.';
  return null;
}

export function required(fields) {
  const errors = {};
  for (const [key, { value, label }] of Object.entries(fields)) {
    if (!String(value ?? '').trim()) errors[key] = `${label} is required.`;
  }
  return errors;
}