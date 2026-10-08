ALTER TABLE "lead_item" DROP CONSTRAINT "lead_item_lead_id_product_id_variant_id_pk";--> statement-breakpoint
-- Added by hand. Postgres marks PRIMARY KEY columns NOT NULL implicitly and
-- does NOT clear that when the constraint is dropped, so without these two
-- statements product_id/variant_id stay NOT NULL and a product-level quote
-- line is still impossible — the exact bug this migration exists to fix.
ALTER TABLE "lead_item" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_item" ALTER COLUMN "variant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lead_item" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE INDEX "lead_item_lead_idx" ON "lead_item" USING btree ("lead_id");--> statement-breakpoint
ALTER TABLE "lead_item" ADD CONSTRAINT "lead_item_unique" UNIQUE NULLS NOT DISTINCT("lead_id","product_id","variant_id");--> statement-breakpoint
ALTER TABLE "lead_item" ADD CONSTRAINT "lead_item_target_present" CHECK ("lead_item"."product_id" IS NOT NULL OR "lead_item"."variant_id" IS NOT NULL);