import bcrypt from "bcryptjs";

const PIN_REGEX = /^\d{4}$/;
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

export function isValidPinFormat(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  if (!isValidPinFormat(pin)) throw new Error("Invalid PIN format");
  return bcrypt.hash(pin, ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  if (!isValidPinFormat(pin)) return false;
  return bcrypt.compare(pin, hash);
}
