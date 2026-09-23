import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const rsvps = pgTable("rsvps", {
  id: serial().primaryKey(),
  name: text().notNull(),
  side: text().notNull(),
  response: text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
