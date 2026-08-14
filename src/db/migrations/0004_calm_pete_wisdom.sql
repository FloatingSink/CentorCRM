CREATE TYPE "public"."product_doc_language" AS ENUM('en', 'zh', 'bilingual');--> statement-breakpoint
CREATE TYPE "public"."product_doc_type" AS ENUM('TDS', 'SDS', 'COC', 'test_report', 'other');--> statement-breakpoint
CREATE TABLE "product_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"doc_type" "product_doc_type" NOT NULL,
	"language" "product_doc_language" NOT NULL,
	"version" text,
	"issued_date" date,
	"file_key" text NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "product_document" ADD CONSTRAINT "product_document_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_document" ADD CONSTRAINT "product_document_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_document_current_unique" ON "product_document" USING btree ("product_id","doc_type","language") WHERE "product_document"."is_current" = true;