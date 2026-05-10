import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/auth.js";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import type { Request, Response } from "express";

const router = Router();

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    plan: user.plan,
    aiCredits: user.aiCredits,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: "Name, email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ success: false, message: "Email already in use" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash }).returning();
  if (!user) {
    res.status(500).json({ success: false, message: "Failed to create user" });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: sanitizeUser(user) });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }
  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: sanitizeUser(user) });
});

router.get("/auth/me", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json(sanitizeUser(user));
});

router.put("/auth/update-profile", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const { name, avatar } = req.body as { name?: string; avatar?: string };
  const updates: Partial<typeof usersTable.$inferSelect> = {};
  if (name) updates.name = name;
  if (avatar !== undefined) updates.avatar = avatar;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json(sanitizeUser(updated));
});

export default router;
