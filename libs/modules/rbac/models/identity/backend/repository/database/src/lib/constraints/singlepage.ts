import { sql } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";

export interface IConstraintColumns {
  usage: pgCore.PgColumn;
  password: pgCore.PgColumn;
  salt: pgCore.PgColumn;
  code: pgCore.PgColumn;
  account: pgCore.PgColumn;
  email: pgCore.PgColumn;
  provider: pgCore.PgColumn;
}

export function constraints(
  table: IConstraintColumns,
): pgCore.PgTableExtraConfigValue[] {
  return [
    pgCore.check(
      "sps_rc_identity_provider_purpose",
      sql`
      (${table.usage} = 'inbound' AND ${table.provider} NOT IN ('openai','openrouter'))
      OR (${table.usage} = 'outbound_api' AND ${table.provider} IN ('openai','openrouter')
      AND ${table.password} IS NULL AND ${table.salt} IS NULL AND ${table.code} IS NULL
      AND ${table.email} IS NULL AND ${table.account} IS NULL)`,
    ),

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
  ];
}
