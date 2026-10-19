import { randomBytes } from "node:crypto";

export function generateId(length = 32) {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}
