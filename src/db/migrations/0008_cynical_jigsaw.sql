CREATE TABLE "purchase_order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_no" text NOT NULL,
	"contract_no" text,
	"legal_entity_id" uuid NOT NULL,
	"supplier_company_id" uuid,
	"supplier_legal_entity_id" uuid,
	"project_id" uuid NOT NULL,
	"linked_sales_order_id" uuid,
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
	CONSTRAINT "purchase_order_supplier_xor" CHECK (("purchase_order"."supplier_company_id" IS NOT NULL) <> ("purchase_order"."supplier_legal_entity_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "order_line" ADD COLUMN "purchase_order_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplier_company_id_company_id_fk" FOREIGN KEY ("supplier_company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplier_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("supplier_legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_linked_sales_order_id_sales_order_id_fk" FOREIGN KEY ("linked_sales_order_id") REFERENCES "public"."sales_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_purchase_order_id_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_purchase_type_matches" CHECK (("order_line"."order_type" = 'purchase') = ("order_line"."purchase_order_id" IS NOT NULL));