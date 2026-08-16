CREATE TYPE "public"."dashboard_widget_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."dashboard_widget_type" AS ENUM('opportunities_by_stage', 'quotes_expiring', 'shipments_placeholder', 'my_open_opportunities', 'purchase_orders_awaiting_confirmation', 'pipeline_value', 'recent_activity');--> statement-breakpoint
CREATE TABLE "dashboard_widget" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"widget_type" "dashboard_widget_type" NOT NULL,
	"position" integer NOT NULL,
	"size" "dashboard_widget_size" DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "dashboard_widget" ADD CONSTRAINT "dashboard_widget_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_widget" ADD CONSTRAINT "dashboard_widget_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_widget_user_type_unique" ON "dashboard_widget" USING btree ("user_id","widget_type");