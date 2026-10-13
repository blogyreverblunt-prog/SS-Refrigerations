CREATE TABLE "customer_identity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"email" "citext",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "customer_identity" ADD CONSTRAINT "customer_identity_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_identity_provider_account_idx" ON "customer_identity" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "customer_identity_customer_idx" ON "customer_identity" USING btree ("customer_id");