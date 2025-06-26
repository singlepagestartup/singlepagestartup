ALTER TABLE "sl_cs_to_ms_e6r" DROP CONSTRAINT "sl_cs_to_ms_e6r_ct_id_sl_widget_id_fk";
--> statement-breakpoint
ALTER TABLE "sl_cs_to_ms_e6r" ADD CONSTRAINT "sl_cs_to_ms_e6r_ct_id_sl_chat_id_fk" FOREIGN KEY ("ct_id") REFERENCES "public"."sl_chat"("id") ON DELETE cascade ON UPDATE no action;