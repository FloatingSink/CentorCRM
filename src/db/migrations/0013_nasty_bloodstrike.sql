ALTER TABLE "opportunity" ALTER COLUMN "estimated_value" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "quotation_line" ALTER COLUMN "unit_price" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "quotation_line" ALTER COLUMN "line_total" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "order_line" ALTER COLUMN "unit_price" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "order_line" ALTER COLUMN "line_total" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "sales_order" ALTER COLUMN "total_value" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "purchase_order" ALTER COLUMN "total_value" SET DATA TYPE bigint;