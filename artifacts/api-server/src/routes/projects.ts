import { Router } from "express";
import { db, projectsTable, projectDesignsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import type { Request, Response } from "express";

const router = Router();

async function getProjectWithCount(projectId: number, userId: number) {
  const [project] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
  if (!project) return null;
  const designs = await db.select().from(projectDesignsTable).where(eq(projectDesignsTable.projectId, projectId));
  return {
    id: project.id,
    userId: project.userId,
    name: project.name,
    description: project.description,
    status: project.status,
    designCount: designs.length,
    createdAt: project.createdAt.toISOString(),
  };
}

router.get("/projects", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const projects = await db.select().from(projectsTable)
    .where(eq(projectsTable.userId, userId))
    .orderBy(desc(projectsTable.createdAt));
  const withCounts = await Promise.all(projects.map(async (p) => {
    const designs = await db.select().from(projectDesignsTable).where(eq(projectDesignsTable.projectId, p.id));
    return {
      id: p.id,
      userId: p.userId,
      name: p.name,
      description: p.description,
      status: p.status,
      designCount: designs.length,
      createdAt: p.createdAt.toISOString(),
    };
  }));
  res.json(withCounts);
});

router.post("/projects", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const { name, description } = req.body as { name: string; description?: string };
  if (!name) {
    res.status(400).json({ success: false, message: "Name is required" });
    return;
  }
  const [project] = await db.insert(projectsTable).values({ userId, name, description }).returning();
  if (!project) {
    res.status(500).json({ success: false, message: "Failed to create project" });
    return;
  }
  res.status(201).json({ ...project, designCount: 0, createdAt: project.createdAt.toISOString() });
});

router.put("/projects/:id", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  const { name, description, status } = req.body as { name?: string; description?: string; status?: "active" | "completed" };
  const updates: Partial<typeof projectsTable.$inferSelect> = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (status) updates.status = status;
  await db.update(projectsTable).set(updates).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));
  const result = await getProjectWithCount(id, userId);
  if (!result) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }
  res.json(result);
});

router.delete("/projects/:id", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  await db.delete(projectDesignsTable).where(eq(projectDesignsTable.projectId, id));
  await db.delete(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));
  res.json({ success: true });
});

router.post("/projects/:id/add-design", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const id = parseInt(req.params["id"] ?? "0");
  const { designId } = req.body as { designId: number };
  if (!designId) {
    res.status(400).json({ success: false, message: "designId is required" });
    return;
  }
  await db.insert(projectDesignsTable).values({ projectId: id, designId }).onConflictDoNothing();
  const result = await getProjectWithCount(id, userId);
  if (!result) {
    res.status(404).json({ success: false, message: "Project not found" });
    return;
  }
  res.json(result);
});

export default router;
