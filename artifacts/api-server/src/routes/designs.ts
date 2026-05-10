import { Router } from "express";
import { db, designsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import type { Request, Response } from "express";

const router = Router();

function sanitizeDesign(d: typeof designsTable.$inferSelect) {
  return {
    id: d.id,
    userId: d.userId,
    title: d.title,
    featureType: d.featureType,
    beforeImage: d.beforeImage,
    afterImage: d.afterImage,
    selectedStyle: d.selectedStyle,
    selectedRoom: d.selectedRoom,
    aiResponse: d.aiResponse,
    isFavorite: d.isFavorite,
    tags: d.tags,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/designs", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const page = parseInt(String(req.query["page"] ?? "1"));
  const limit = parseInt(String(req.query["limit"] ?? "20"));
  const offset = (page - 1) * limit;
  const designs = await db.select().from(designsTable)
    .where(eq(designsTable.userId, userId))
    .orderBy(desc(designsTable.createdAt))
    .limit(limit)
    .offset(offset);
  const all = await db.select({ id: designsTable.id }).from(designsTable).where(eq(designsTable.userId, userId));
  res.json({ designs: designs.map(sanitizeDesign), total: all.length, page, limit });
});

router.post("/designs", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const { title, featureType, beforeImage, afterImage, selectedStyle, selectedRoom, aiResponse, tags } = req.body as Record<string, unknown>;
  if (!title || !featureType) {
    res.status(400).json({ success: false, message: "Title and featureType are required" });
    return;
  }
  const [design] = await db.insert(designsTable).values({
    userId,
    title: title as string,
    featureType: featureType as "home" | "floor" | "furniture" | "cleanup" | "garden" | "roomdesign" | "objects" | "exterior",
    beforeImage: beforeImage as string | undefined,
    afterImage: afterImage as string | undefined,
    selectedStyle: selectedStyle as string | undefined,
    selectedRoom: selectedRoom as string | undefined,
    aiResponse: aiResponse as string | undefined,
    tags: Array.isArray(tags) ? tags as string[] : [],
  }).returning();
  if (!design) {
    res.status(500).json({ success: false, message: "Failed to create design" });
    return;
  }
  res.status(201).json(sanitizeDesign(design));
});

router.get("/designs/favorites", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const designs = await db.select().from(designsTable)
    .where(and(eq(designsTable.userId, userId), eq(designsTable.isFavorite, true)))
    .orderBy(desc(designsTable.createdAt));
  res.json(designs.map(sanitizeDesign));
});

router.get("/designs/history", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const designs = await db.select().from(designsTable)
    .where(eq(designsTable.userId, userId))
    .orderBy(desc(designsTable.createdAt))
    .limit(20);
  res.json(designs.map(sanitizeDesign));
});

router.get("/designs/:id", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  const [design] = await db.select().from(designsTable)
    .where(and(eq(designsTable.id, id), eq(designsTable.userId, userId)));
  if (!design) {
    res.status(404).json({ success: false, message: "Design not found" });
    return;
  }
  res.json(sanitizeDesign(design));
});

router.put("/designs/:id", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  const { title, isFavorite, tags } = req.body as Record<string, unknown>;
  const updates: Partial<typeof designsTable.$inferSelect> = {};
  if (title !== undefined) updates.title = title as string;
  if (isFavorite !== undefined) updates.isFavorite = Boolean(isFavorite);
  if (tags !== undefined && Array.isArray(tags)) updates.tags = tags as string[];
  const [updated] = await db.update(designsTable).set(updates)
    .where(and(eq(designsTable.id, id), eq(designsTable.userId, userId)))
    .returning();
  if (!updated) {
    res.status(404).json({ success: false, message: "Design not found" });
    return;
  }
  res.json(sanitizeDesign(updated));
});

router.delete("/designs/:id", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  await db.delete(designsTable).where(and(eq(designsTable.id, id), eq(designsTable.userId, userId)));
  res.json({ success: true });
});

router.post("/designs/:id/favorite", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  const [current] = await db.select().from(designsTable)
    .where(and(eq(designsTable.id, id), eq(designsTable.userId, userId)));
  if (!current) {
    res.status(404).json({ success: false, message: "Design not found" });
    return;
  }
  const [updated] = await db.update(designsTable)
    .set({ isFavorite: !current.isFavorite })
    .where(and(eq(designsTable.id, id), eq(designsTable.userId, userId)))
    .returning();
  res.json(sanitizeDesign(updated!));
});

export default router;
