export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export type PasswordCheck = {
  isValid: boolean;
  score: number; // 0 to 4
  hasMinLen: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  errors: string[];
};

export function validatePassword(password: string): PasswordCheck {
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors: string[] = [];
  if (!hasMinLen) errors.push("Minimum 8 characters");
  if (!hasUpper) errors.push("At least one uppercase letter (A-Z)");
  if (!hasLower) errors.push("At least one lowercase letter (a-z)");
  if (!hasNumber) errors.push("At least one number (0-9)");
  if (!hasSpecial) errors.push("At least one special character (!@#$%^&*)");

  let score = 0;
  if (hasMinLen) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  return {
    isValid: errors.length === 0,
    score,
    hasMinLen,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email.trim());
}
