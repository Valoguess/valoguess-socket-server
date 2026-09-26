import { eq } from "drizzle-orm";
import { user } from "./schema.js";
import { db } from "./index.js";
import { AppError } from "@/shared/utils/error.js";

export async function getUserDetails(userId: string) {
  const userData = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (userData.length === 0) {
    throw new AppError("User not found");
  }

  return userData[0];
}