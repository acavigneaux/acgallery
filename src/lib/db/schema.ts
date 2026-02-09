import { pgTable, text, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const years = pgTable("years", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  year: integer("year").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const yearsRelations = relations(years, ({ many }) => ({
  competitions: many(competitions),
}));

export const competitions = pgTable("competitions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  date: timestamp("date").notNull(),
  location: text("location"),
  description: text("description"),
  coverPhotoId: text("cover_photo_id"),
  yearId: text("year_id").notNull().references(() => years.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("competitions_year_slug_unique").on(table.yearId, table.slug),
  index("competitions_year_id_idx").on(table.yearId),
]);

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  year: one(years, {
    fields: [competitions.yearId],
    references: [years.id],
  }),
  coverPhoto: one(photos, {
    fields: [competitions.coverPhotoId],
    references: [photos.id],
  }),
  photos: many(photos),
}));

export const photos = pgTable("photos", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  filename: text("filename").notNull(),
  originalUrl: text("original_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  size: integer("size").notNull(),
  competitionId: text("competition_id").notNull().references(() => competitions.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("photos_competition_id_idx").on(table.competitionId),
  index("photos_competition_order_idx").on(table.competitionId, table.order),
]);

export const photosRelations = relations(photos, ({ one }) => ({
  competition: one(competitions, {
    fields: [photos.competitionId],
    references: [competitions.id],
  }),
}));
