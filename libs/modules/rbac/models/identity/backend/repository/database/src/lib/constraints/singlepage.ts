import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  account: pgCore.PgColumn;
  email: pgCore.PgColumn;
  provider: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore
      .uniqueIndex("sps_rc_identity_telegram_account_unique")
      .on(table.account)
      .where(
        sql`${table.provider} = 'telegram' AND ${table.account} IS NOT NULL`,
      ),
    pgCore
      .uniqueIndex("sps_rc_identity_oauth_google_account_unique")
      .on(table.account)
      .where(
        sql`${table.provider} = 'oauth_google' AND ${table.account} IS NOT NULL`,
      ),
    pgCore
      .uniqueIndex("sps_rc_identity_evm_account_unique")
      .on(sql`lower(${table.account})`)
      .where(
        sql`${table.provider} = 'ethereum_virtual_machine' AND ${table.account} IS NOT NULL`,
      ),
    pgCore
      .uniqueIndex("sps_rc_identity_email_password_email_unique")
      .on(sql`lower(${table.email})`)
      .where(
        sql`${table.provider} = 'email_and_password' AND ${table.email} IS NOT NULL`,
      ),
    pgCore
      .uniqueIndex("sps_rc_identity_email_email_unique")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.provider} = 'email' AND ${table.email} IS NOT NULL`),
  ];
}
