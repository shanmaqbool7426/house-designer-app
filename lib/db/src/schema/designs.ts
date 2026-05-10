import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const featureTypeEnum = pgEnum("feature_type", [
  "home", "floor", "furniture", "cleanup", "garden", "roomdesign", "objects", "exterior"
]);

export const designsTable = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  featureType: featureTypeEnum("feature_type").notNull(),
  beforeImage: text("before_image"),
  afterImage: text("after_image"),
  selectedStyle: text("selected_style"),
  selectedRoom: text("selected_room"),
  aiResponse: text("ai_response"),
  isFavorite: boolean("is_favorite").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDesignSchema = createInsertSchema(designsTable).omit({ id: true, createdAt: true });
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type Design = typeof designsTable.$inferSelect;
