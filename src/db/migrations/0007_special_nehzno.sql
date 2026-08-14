CREATE TYPE "public"."order_status" AS ENUM('draft', 'confirmed', 'in_production', 'shipped', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('sales', 'purchase');--> statement-breakpoint
CREATE TABLE "order_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_type" "order_type" NOT NULL,
	"sales_order_id" uuid,
	"line_no" integer NOT NULL,
	"product_id" uuid NOT NULL,
	"description_override" text,
	"quantity" integer NOT NULL,
	"uom" text,
	"unit_price" integer NOT NULL,
	"discount_pct" numeric(5, 2),
	"line_total" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "order_line_sales_type_matches" CHECK (("order_line"."order_type" = 'sales') = ("order_line"."sales_order_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "sales_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_no" text NOT NULL,
	"contract_no" text,
	"quotation_id" uuid NOT NULL,
	"legal_entity_id" uuid NOT NULL,
	"customer_company_id" uuid,
	"customer_legal_entity_id" uuid,
	"project_id" uuid NOT NULL,
	"signed_date" date,
	"currency" char(3) NOT NULL,
	"fx_rate_to_sgd" numeric(12, 6) NOT NULL,
	"incoterm" "incoterm",
	"named_place" text,
	"total_value" integer NOT NULL,
	"governing_law" text,
	"arbitration_rules" text,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "sales_order_customer_xor" CHECK (("sales_order"."customer_company_id" IS NOT NULL) <> ("sales_order"."customer_legal_entity_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_sales_order_id_sales_order_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_quotation_id_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_company_id_company_id_fk" FOREIGN KEY ("customer_company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("customer_legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;