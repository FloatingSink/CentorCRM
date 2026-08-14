CREATE TYPE "public"."activity_related_type" AS ENUM('company', 'contact', 'project', 'opportunity', 'sales_order', 'purchase_order');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('note', 'call', 'meeting', 'email');--> statement-breakpoint
CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "activity_type" NOT NULL,
	"subject" text NOT NULL,
	"body" text,
	"occurred_at" timestamp NOT NULL,
	"user_id" uuid NOT NULL,
	"related_type" "activity_related_type" NOT NULL,
	"related_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;