import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import type { Request, Response } from "express";

const router = Router();

const FEATURE_PROMPTS: Record<string, (style: string, room: string) => string> = {
  home: (style) => `Redesign my room in ${style} style. Give 5 specific recommendations covering: furniture choices, color palette, lighting setup, decor items, and layout optimization. Be specific and actionable.`,
  floor: (_, room) => `I'm installing ${room || "hardwood"} floors. Give detailed advice on: quality grades to look for, best installation method, maintenance routine, which rooms it suits best, and rough cost estimate per sq ft.`,
  furniture: (style) => `Rearrange furniture for a '${style || "cozy and functional"}' feel. Give a step-by-step placement guide, traffic flow optimization tips, and focal point advice for the room.`,
  cleanup: () => `Give me a comprehensive room declutter checklist with 10 specific, actionable steps. Include quick wins for immediate impact and long-term maintenance strategies to keep the space organized.`,
  garden: (style) => `Design a ${style || "modern"} garden for a medium backyard. Include: a curated plants list with names, layout zones breakdown, key features to add, and seasonal care calendar.`,
  roomdesign: (style, room) => `Design a ${style || "contemporary"} ${room || "living room"}. Provide: complete furniture list with approximate dimensions, a specific color palette with HEX codes, lighting plan with fixture types, and a rough budget estimate breakdown.`,
  objects: (_, room) => `Replace my ${room || "furniture item"}. Recommend 5 specific options across three tiers: budget (under $200), mid-range ($200–$800), and luxury ($800+). Include brand names, dimensions, key features, and where to buy each.`,
  exterior: (style) => `Redesign my home exterior in ${style || "modern farmhouse"} style. Cover: siding material with specific product recommendations, roof style options, window and door styles, front landscaping plan, color combinations with HEX codes, and lighting plan.`,
};

router.post("/ai/generate", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const { featureType, selectedStyle, selectedRoom, prompt } = req.body as {
    featureType: string;
    selectedStyle?: string;
    selectedRoom?: string;
    prompt?: string;
  };

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  if (user.plan !== "pro" && user.aiCredits <= 0) {
    res.status(403).json({ success: false, message: "No AI credits remaining" });
    return;
  }

  const promptFn = FEATURE_PROMPTS[featureType];
  const finalPrompt = prompt || (promptFn
    ? promptFn(selectedStyle ?? "", selectedRoom ?? "")
    : `Give design advice for ${featureType}`);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: "You are an expert interior designer and home design AI. Give specific, actionable design advice formatted with clear sections and bullet points. Keep responses under 300 words. Focus on practical, beautiful, and achievable recommendations.",
    messages: [{ role: "user", content: finalPrompt }],
  });

  const block = message.content[0];
  const aiResponse = block && block.type === "text" ? block.text : "";

  if (user.plan !== "pro") {
    await db.update(usersTable).set({ aiCredits: user.aiCredits - 1 }).where(eq(usersTable.id, userId));
  }

  const [updated] = await db.select({ aiCredits: usersTable.aiCredits }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ response: aiResponse, creditsRemaining: updated?.aiCredits ?? 0 });
});

router.post("/ai/tip", authMiddleware, async (_req: Request, res: Response) => {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 8192,
    system: "You are an interior design expert. Give a single, inspiring, practical daily design tip in 2-3 sentences. Make it specific and actionable.",
    messages: [{ role: "user", content: "Give me today's home design tip." }],
  });
  const block = message.content[0];
  const tip = block && block.type === "text" ? block.text : "Great design starts with decluttering — remove 3 items from any room today.";
  res.json({ tip });
});

router.get("/ai/credits", authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const [user] = await db.select({ aiCredits: usersTable.aiCredits, plan: usersTable.plan }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json({ credits: user.aiCredits, plan: user.plan });
});

export default router;
