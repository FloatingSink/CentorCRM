CREATE TYPE "public"."product_category" AS ENUM('tail_seal_grease', 'soil_conditioner', 'ep_grease', 'polymer', 'anti_wear', 'other');--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centor_code" text NOT NULL,
	"name_en" text NOT NULL,
	"name_zh" text,
	"category" "product_category",
	"uom" text,
	"pack_size" text,
	"pack_description" text,
	"manufacturer_company_id" uuid,
	"manufacturer_part_no" text,
	"hs_code" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_manufacturer_company_id_company_id_fk" FOREIGN KEY ("manufacturer_company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;