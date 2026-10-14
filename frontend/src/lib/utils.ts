import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mirrors the backend password policy (auth/demands validators): min 8 chars
// with at least one lowercase, one uppercase and one digit.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && PASSWORD_REGEX.test(password);
}
