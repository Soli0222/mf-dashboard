CREATE TABLE "account_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"status" text NOT NULL,
	"last_updated" text,
	"total_assets" integer DEFAULT 0,
	"error_message" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "account_statuses_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"mf_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"institution" text,
	"category_id" integer,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "accounts_mf_id_unique" UNIQUE("mf_id")
);
--> statement-breakpoint
CREATE TABLE "asset_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "asset_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "asset_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"date" text NOT NULL,
	"total_assets" integer NOT NULL,
	"change" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_history_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_history_id" integer NOT NULL,
	"category_name" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"date" text NOT NULL,
	"refresh_completed" boolean DEFAULT true,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"account_id" integer NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_current" boolean DEFAULT false,
	"last_scraped_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holding_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"holding_id" integer NOT NULL,
	"snapshot_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"quantity" real,
	"unit_price" real,
	"avg_cost_price" real,
	"daily_change" integer,
	"unrealized_gain" integer,
	"unrealized_gain_pct" real,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"mf_id" text,
	"account_id" integer NOT NULL,
	"category_id" integer,
	"name" text NOT NULL,
	"code" text,
	"type" text NOT NULL,
	"liability_category" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "holdings_mf_id_unique" UNIQUE("mf_id")
);
--> statement-breakpoint
CREATE TABLE "institution_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_order" integer,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "institution_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "spending_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"large_category_id" integer NOT NULL,
	"category_name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mf_id" text NOT NULL,
	"date" text NOT NULL,
	"account_id" integer,
	"category" text,
	"sub_category" text,
	"description" text,
	"amount" integer NOT NULL,
	"type" text NOT NULL,
	"is_transfer" boolean DEFAULT false NOT NULL,
	"is_excluded_from_calculation" boolean DEFAULT false NOT NULL,
	"transfer_target" text,
	"transfer_target_account_id" integer,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "transactions_mf_id_unique" UNIQUE("mf_id")
);
--> statement-breakpoint
ALTER TABLE "account_statuses" ADD CONSTRAINT "account_statuses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_category_id_institution_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."institution_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_history_categories" ADD CONSTRAINT "asset_history_categories_asset_history_id_asset_history_id_fk" FOREIGN KEY ("asset_history_id") REFERENCES "public"."asset_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD CONSTRAINT "daily_snapshots_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_accounts" ADD CONSTRAINT "group_accounts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_accounts" ADD CONSTRAINT "group_accounts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holding_values" ADD CONSTRAINT "holding_values_holding_id_holdings_id_fk" FOREIGN KEY ("holding_id") REFERENCES "public"."holdings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holding_values" ADD CONSTRAINT "holding_values_snapshot_id_daily_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."daily_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_category_id_asset_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_targets" ADD CONSTRAINT "spending_targets_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transfer_target_account_id_accounts_id_fk" FOREIGN KEY ("transfer_target_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_category_id_idx" ON "accounts" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_history_group_date_idx" ON "asset_history" USING btree ("group_id","date");--> statement-breakpoint
CREATE INDEX "asset_history_group_id_idx" ON "asset_history" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_history_categories_history_category_idx" ON "asset_history_categories" USING btree ("asset_history_id","category_name");--> statement-breakpoint
CREATE INDEX "daily_snapshots_date_idx" ON "daily_snapshots" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "group_accounts_group_account_idx" ON "group_accounts" USING btree ("group_id","account_id");--> statement-breakpoint
CREATE INDEX "group_accounts_group_id_idx" ON "group_accounts" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_accounts_account_id_idx" ON "group_accounts" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "holding_values_holding_snapshot_idx" ON "holding_values" USING btree ("holding_id","snapshot_id");--> statement-breakpoint
CREATE INDEX "holdings_account_id_idx" ON "holdings" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "spending_targets_group_category_idx" ON "spending_targets" USING btree ("group_id","large_category_id");--> statement-breakpoint
CREATE INDEX "spending_targets_group_id_idx" ON "spending_targets" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_account_id_idx" ON "transactions" USING btree ("account_id");