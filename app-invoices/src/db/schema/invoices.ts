import { pgTable, pgEnum, text, integer, timestamp } from "drizzle-orm/pg-core";

export const invoices = pgTable("invoices", {
  id: text().primaryKey(),
  orderId: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
