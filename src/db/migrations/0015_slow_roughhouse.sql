CREATE UNIQUE INDEX "quotation_legal_entity_quote_no_version_unique" ON "quotation" USING btree ("legal_entity_id","quote_no","version");--> statement-breakpoint
CREATE UNIQUE INDEX "sales_order_order_no_unique" ON "sales_order" USING btree ("order_no");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_order_order_no_unique" ON "purchase_order" USING btree ("order_no");