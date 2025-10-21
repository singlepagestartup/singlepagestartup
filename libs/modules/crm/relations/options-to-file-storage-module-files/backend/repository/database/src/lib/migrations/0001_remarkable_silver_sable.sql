ALTER TABLE "cm_os_to_fs_se_me_fe_gwo" RENAME COLUMN "fe_se_id" TO "fe_se_me_fe_id";--> statement-breakpoint
ALTER TABLE "cm_os_to_fs_se_me_fe_gwo" DROP CONSTRAINT "cm_os_to_fs_se_me_fe_gwo_fe_se_id_sps_f_s_file_id_fk";
--> statement-breakpoint
ALTER TABLE "cm_os_to_fs_se_me_fe_gwo" ADD CONSTRAINT "cm_os_to_fs_se_me_fe_gwo_fe_se_me_fe_id_sps_f_s_file_id_fk" FOREIGN KEY ("fe_se_me_fe_id") REFERENCES "public"."sps_f_s_file"("id") ON DELETE cascade ON UPDATE no action;