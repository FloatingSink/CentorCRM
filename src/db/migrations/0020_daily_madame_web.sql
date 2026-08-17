CREATE TYPE "public"."task_related_type" AS ENUM('company', 'contact', 'project', 'opportunity', 'sales_order', 'purchase_order');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'done');--> statement-breakpoint
ALTER TYPE "public"."audit_entity_type" ADD VALUE 'task';--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assignee_user_id" uuid NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"due_date" date,
	"related_type" "task_related_type",
	"related_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "task_related_pair" CHECK (("task"."related_type" IS NULL) = ("task"."related_id" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_assignee_user_id_idx" ON "task" USING btree ("assignee_user_id");