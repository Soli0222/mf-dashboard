---
name: db-schema-change
description: Use when adding/modifying database tables or columns in Drizzle ORM schema
---

# DB Schema Change Skill

## Checklist (MUST complete all)

- [ ] Add `createdAt: text("created_at").notNull()` to new tables
- [ ] Add `updatedAt: text("updated_at").notNull()` to new tables
- [ ] Specify `onDelete` for all foreign keys (cascade/set null)
- [ ] Add index for frequently queried columns
- [ ] Update `packages/db/src/schema/relations.ts` if adding relations
- [ ] Run migration: `pnpm --filter @moneyforward-daily-action/db exec drizzle-kit generate`
- [ ] Update `architecture/database-schema.md` with new ERD

## File Locations

- Schema: `packages/db/src/schema/tables.ts`
- Relations: `packages/db/src/schema/relations.ts`
- Repositories: `packages/db/src/repositories/`
- Types: `packages/db/src/types.ts`

## Template

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const newTable = pgTable("new_table", {
  id: serial("id").primaryKey(),
  // ... your columns ...
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
```

## Foreign Key Template

```typescript
foreignKeyColumn: integer("foreign_key_column")
  .notNull()
  .references(() => parentTable.id, { onDelete: "cascade" }),
// Note: Use serial() for auto-increment primary keys, integer() for regular integers
```

## Index Template

```typescript
export const myTable = pgTable(
  "my_table",
  {
    // columns...
  },
  (table) => [index("my_table_column_idx").on(table.columnName)],
);
```
