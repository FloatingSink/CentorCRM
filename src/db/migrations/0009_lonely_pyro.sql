CREATE TYPE "public"."order_language" AS ENUM('en', 'zh', 'bilingual');--> statement-breakpoint
ALTER TABLE "order_line" ADD COLUMN "net_weight_kg" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "sales_order" ADD COLUMN "language" "order_language" DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "delivery_location" text;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "required_delivery_date" date;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "delivery_method" text;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "inspection_days" integer;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD COLUMN "language" "order_language" DEFAULT 'en' NOT NULL;