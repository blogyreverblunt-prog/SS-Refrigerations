-- ─── EXTENSIONS ─────────────────────────────────────────────────────────────
-- Prepended by hand: drizzle-kit emits ltree / citext / geography columns but
-- cannot know the extensions that provide them, so without this the very
-- first migration fails on a clean database.
--   ltree    category.path — GiST subtree + ancestor queries (HLD.md §7.2)
--   pg_trgm  fuzzy product search alongside tsvector
--   citext   lead.email — case-insensitive, so uniqueness is real
--   postgis  installation.geo — radius / nearest-neighbour on the map
CREATE EXTENSION IF NOT EXISTS ltree;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE SEQUENCE "public"."lead_ref_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"kind" text DEFAULT 'image' NOT NULL,
	"storage_key" text NOT NULL,
	"alt" text,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"content_type" text,
	"variants" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_kind_valid" CHECK ("asset"."kind" IN ('image','render','line_drawing','video'))
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"path" "ltree" NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"category_id" uuid,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"storage_key" text NOT NULL,
	"bytes" integer,
	"language" text DEFAULT 'en' NOT NULL,
	"extracted_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_kind_valid" CHECK ("document"."kind" IN ('spec_sheet','manual','brochure','catalogue','certificate','cad','warranty'))
);
--> statement-breakpoint
CREATE TABLE "industry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "industry_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"series" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"summary" text,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"search_tsv" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(series, '')), 'B') || setweight(to_tsvector('english', coalesce(summary, '')), 'C')) STORED,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_status_valid" CHECK ("product"."status" IN ('draft','live','archived'))
);
--> statement-breakpoint
CREATE TABLE "product_industry" (
	"product_id" uuid NOT NULL,
	"industry_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"model_code" text NOT NULL,
	"capacity_l" numeric,
	"gn_config" text,
	"temp_min_c" numeric,
	"temp_max_c" numeric,
	"refrigerant" text,
	"ambient_max_c" numeric DEFAULT '43',
	"power_w" integer,
	"energy_class" text,
	"dims_mm" jsonb,
	"weight_kg" numeric,
	"mrp_inr" numeric,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_variant_model_code_unique" UNIQUE("model_code"),
	CONSTRAINT "temp_range_valid" CHECK ("product_variant"."temp_min_c" IS NULL OR "product_variant"."temp_max_c" >= "product_variant"."temp_min_c")
);
--> statement-breakpoint
CREATE TABLE "content_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"author_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"client_name" text NOT NULL,
	"city" text,
	"industry_id" uuid,
	"summary" text,
	"geo" "geography",
	"status" text DEFAULT 'draft' NOT NULL,
	"commissioned_on" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installation_slug_unique" UNIQUE("slug"),
	CONSTRAINT "installation_status_valid" CHECK ("installation"."status" IN ('draft','live','archived'))
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"location" text,
	"employment_type" text,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"posted_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	CONSTRAINT "job_slug_unique" UNIQUE("slug"),
	CONSTRAINT "job_status_valid" CHECK ("job"."status" IN ('draft','live','archived'))
);
--> statement-breakpoint
CREATE TABLE "job_application" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"cv_storage_key" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" text,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"hero_asset_key" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_post_slug_unique" UNIQUE("slug"),
	CONSTRAINT "news_status_valid" CHECK ("news_post"."status" IN ('draft','live','archived'))
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"email" "citext" NOT NULL,
	"phone" text,
	"company" text,
	"city" text,
	"message" text,
	"source" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"owner_id" uuid,
	"crm_ref" text,
	"consent_at" timestamp with time zone NOT NULL,
	"ip_hash" "bytea",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_ref_unique" UNIQUE("ref"),
	CONSTRAINT "lead_type_valid" CHECK ("lead"."type" IN ('contact','rfq','support','callback','demo'))
);
--> statement-breakpoint
CREATE TABLE "lead_item" (
	"lead_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"qty" integer DEFAULT 1 NOT NULL,
	"note" text,
	CONSTRAINT "lead_item_lead_id_product_id_variant_id_pk" PRIMARY KEY("lead_id","product_id","variant_id"),
	CONSTRAINT "lead_item_qty_positive" CHECK ("lead_item"."qty" > 0)
);
--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'editor' NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_label" text DEFAULT 'system' NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "redirect" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirect_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_industry" ADD CONSTRAINT "product_industry_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_industry" ADD CONSTRAINT "product_industry_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revision" ADD CONSTRAINT "content_revision_author_id_app_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installation" ADD CONSTRAINT "installation_industry_id_industry_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industry"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application" ADD CONSTRAINT "job_application_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_owner_id_app_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_item" ADD CONSTRAINT "lead_item_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_item" ADD CONSTRAINT "lead_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_item" ADD CONSTRAINT "lead_item_variant_id_product_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_app_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_product_idx" ON "asset" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "category_path_gist" ON "category" USING gist ("path");--> statement-breakpoint
CREATE INDEX "document_product_idx" ON "document" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "document_category_idx" ON "document" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_specs_gin" ON "product" USING gin ("specs" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "product_tsv_gin" ON "product" USING gin ("search_tsv");--> statement-breakpoint
CREATE INDEX "product_live_idx" ON "product" USING btree ("category_id","sort_order") WHERE "product"."status" = 'live';--> statement-breakpoint
CREATE UNIQUE INDEX "product_industry_pk" ON "product_industry" USING btree ("product_id","industry_id");--> statement-breakpoint
CREATE INDEX "product_industry_by_industry" ON "product_industry" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "variant_product_idx" ON "product_variant" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "revision_entity_version" ON "content_revision" USING btree ("entity_type","entity_id","version");--> statement-breakpoint
CREATE INDEX "revision_created_brin" ON "content_revision" USING brin ("created_at");--> statement-breakpoint
CREATE INDEX "installation_geo_gist" ON "installation" USING gist ("geo");--> statement-breakpoint
CREATE INDEX "installation_industry_idx" ON "installation" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "application_job_idx" ON "job_application" USING btree ("job_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "application_created_brin" ON "job_application" USING brin ("created_at");--> statement-breakpoint
CREATE INDEX "news_tags_gin" ON "news_post" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "news_published_brin" ON "news_post" USING brin ("published_at");--> statement-breakpoint
CREATE INDEX "lead_created_brin" ON "lead" USING brin ("created_at");--> statement-breakpoint
CREATE INDEX "lead_triage_idx" ON "lead" USING btree ("status","created_at" DESC NULLS LAST) WHERE "lead"."status" <> 'closed';--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_created_brin" ON "audit_log" USING brin ("created_at");--> statement-breakpoint
CREATE INDEX "outbox_unpublished" ON "outbox" USING btree ("id") WHERE "outbox"."published_at" IS NULL;--> statement-breakpoint
CREATE INDEX "outbox_aggregate_idx" ON "outbox" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "redirect_from_idx" ON "redirect" USING btree ("from_path");--> statement-breakpoint
-- ─── POSTGIS TYPE MODIFIER ──────────────────────────────────────────────────
-- Appended by hand. See src/db/types.ts: the column is declared as a bare
-- `geography` because drizzle-kit would quote `geography(Point, 4326)` as a
-- single identifier, which Postgres rejects (42704). Tightening it here keeps
-- the HLD.md §7.2 constraint — points only, WGS84 — without fighting the
-- generator. The GiST index above is rebuilt automatically by the ALTER.
ALTER TABLE "installation" ALTER COLUMN "geo" TYPE geography(Point,4326);
