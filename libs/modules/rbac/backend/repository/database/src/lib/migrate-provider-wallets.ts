import { getPostgresClient } from "@sps/shared-backend-database-config";

const db = getPostgresClient();

async function migrate() {
  await db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended('sps.provider-wallet-cutover', 0))`;
    const hasTable = async (name: string) => {
      const [row] =
        await tx`SELECT to_regclass(${"public." + name}) IS NOT NULL AS present`;
      return row.present === true;
    };
    const balances = "sps_rc_ss_to_bg_me_cs_vvd";
    const operations = "sps_rc_wallet_operation";
    const identities = "sps_rc_subject_provider_identity";
    const agents = "sps_rc_subject_provider_agent";
    const sources: string[] = [];
    for (const table of [balances, operations, identities, agents]) {
      if (await hasTable(table)) {
        await tx`LOCK TABLE ${tx(table)} IN ACCESS EXCLUSIVE MODE`;
        sources.push(table);
      }
    }

    // Wallet creation uses the same subject lock in the compatibility view and the owning service.
    await tx`CREATE OR REPLACE FUNCTION sps_rc_default_billing_wallet(owner_id uuid) RETURNS uuid
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
      DECLARE result uuid;
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtextextended('rbac.default-wallet:' || owner_id::text, 0));
        SELECT wallet_id INTO result FROM public.sps_rc_subject_wallet WHERE subject_id = owner_id AND variant = 'default';
        IF NOT FOUND THEN
          INSERT INTO public.sps_bg_wallet DEFAULT VALUES RETURNING id INTO result;
          INSERT INTO public.sps_rc_subject_wallet(subject_id,wallet_id) VALUES(owner_id,result);
        END IF;
        RETURN result;
      END $$`;

    if (sources.includes(balances)) {
      await tx`INSERT INTO sps_bg_wallet_currency(id,created_at,updated_at,variant,order_index,class_name,wallet_id,currency_id,amount)
        SELECT id,created_at,updated_at,variant,order_index,class_name,sps_rc_default_billing_wallet(st_id),bg_me_cy_id,amount::numeric
        FROM sps_rc_ss_to_bg_me_cs_vvd`;
    }
    if (sources.includes(operations)) {
      await tx`INSERT INTO sps_bg_transaction
        SELECT (jsonb_populate_record(NULL::sps_bg_transaction, jsonb_build_object('advance_amount', 0) || to_jsonb(op))).*
        FROM sps_rc_wallet_operation op`;
      await tx`INSERT INTO sps_bg_transaction_wallet(transaction_id, sender_wallet_id, recipient_wallet_id, advance_recipient_wallet_id, currency_id)
        SELECT t.id, sps_rc_default_billing_wallet(t.sender_id), sps_rc_default_billing_wallet(t.recipient_id),
          CASE WHEN t.advance_recipient_id IS NOT NULL THEN sps_rc_default_billing_wallet(t.advance_recipient_id) END, t.currency_id
        FROM sps_bg_transaction t JOIN sps_rc_wallet_operation legacy USING(id)`;
    }
    if (sources.includes(identities)) {
      await tx`INSERT INTO sps_rc_ss_to_is_h58(id,created_at,updated_at,variant,st_id,iy_id,owner_id,store_id,label,external_account,version,active)
        SELECT id,created_at,updated_at,'provider-connection',subject_id,identity_id,owner_id,store_id,label,external_account,version,active
        FROM sps_rc_subject_provider_identity`;
      await tx`UPDATE sps_rc_subject s SET variant = 'provider-agent'
        WHERE s.variant = 'agent' AND EXISTS (SELECT 1 FROM sps_rc_subject_provider_identity c WHERE c.subject_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM rc_ss_to_ee_me_ss_htr g WHERE g.st_id = s.id AND g.variant IN ('assistant','crm-agent'))`;
    }
    if (sources.includes(agents)) {
      const [invalid] =
        await tx`SELECT a.id FROM sps_rc_subject_provider_agent a
        WHERE NOT EXISTS (SELECT 1 FROM sps_rc_ss_to_is_h58 c WHERE c.variant='provider-connection'
          AND c.iy_id=a.identity_id AND c.st_id=a.executor_id AND c.store_id=a.store_id) LIMIT 1`;
      if (invalid) {
        throw new Error(
          "Cannot migrate a provider assignment without its store connection",
        );
      }
      await tx`INSERT INTO sps_rc_ss_to_is_h58(id,created_at,updated_at,variant,st_id,iy_id,store_id,capability,model,terms)
        SELECT id,created_at,updated_at,CASE WHEN subject_id IS NULL THEN 'provider-default' ELSE 'provider-assignment' END,
          coalesce(subject_id,executor_id),identity_id,store_id,capability,model,terms FROM sps_rc_subject_provider_agent`;
    }
    for (const table of sources) {
      await tx`ALTER TABLE ${tx(table)} RENAME TO ${tx(table + "_legacy")}`;
    }
    // Keep retained rows independent of subsequent deletes in the live wallet and identity tables.
    for (const name of [balances, operations, identities, agents]) {
      const archived = name + "_legacy";
      if (!(await hasTable(archived))) {
        continue;
      }
      await tx`DROP TRIGGER IF EXISTS sps_consistency_rows ON ${tx(archived)}`;
      await tx`DROP TRIGGER IF EXISTS sps_consistency_truncate ON ${tx(archived)}`;
      const foreignKeys = await tx`SELECT conname FROM pg_constraint
        WHERE contype='f' AND conrelid=to_regclass(${"public." + archived})`;
      for (const { conname } of foreignKeys) {
        await tx`ALTER TABLE ${tx(archived)} DROP CONSTRAINT ${tx(conname)}`;
      }
    }
    // The historical admin API and SDK continue to expose the same IDs and amount strings.
    await tx`CREATE OR REPLACE VIEW sps_rc_subject_wallet_balance AS
      SELECT b.id,b.created_at,b.updated_at,b.variant,b.order_index,b.class_name,b.amount::text AS amount,
        o.subject_id AS st_id,b.currency_id AS bg_me_cy_id
      FROM sps_bg_wallet_currency b JOIN sps_rc_subject_wallet o ON o.wallet_id=b.wallet_id AND o.variant='default'`;
    await tx`CREATE OR REPLACE FUNCTION sps_rc_write_subject_wallet_balance() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
      DECLARE wallet uuid;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          DELETE FROM public.sps_bg_wallet_currency WHERE id=OLD.id;
          IF NOT FOUND THEN RETURN NULL; END IF;
          RETURN OLD;
        END IF;
        wallet := public.sps_rc_default_billing_wallet(NEW.st_id);
        IF TG_OP = 'INSERT' THEN
          NEW.id := coalesce(NEW.id,gen_random_uuid());
          NEW.created_at := coalesce(NEW.created_at,now());
          NEW.updated_at := coalesce(NEW.updated_at,now());
          NEW.variant := coalesce(NEW.variant,'default');
          NEW.order_index := coalesce(NEW.order_index,0);
          NEW.amount := coalesce(NEW.amount,'0');
          INSERT INTO public.sps_bg_wallet_currency(id,created_at,updated_at,variant,order_index,class_name,wallet_id,currency_id,amount)
            VALUES(NEW.id,NEW.created_at,NEW.updated_at,NEW.variant,NEW.order_index,NEW.class_name,wallet,NEW.bg_me_cy_id,NEW.amount::numeric);
        ELSE
          UPDATE public.sps_bg_wallet_currency SET id=NEW.id,created_at=NEW.created_at,updated_at=NEW.updated_at,
            variant=NEW.variant,order_index=NEW.order_index,class_name=NEW.class_name,wallet_id=wallet,currency_id=NEW.bg_me_cy_id,
            amount=NEW.amount::numeric WHERE id=OLD.id AND amount=OLD.amount::numeric;
          IF NOT FOUND THEN RETURN NULL; END IF;
        END IF;
        RETURN NEW;
      END $$`;
    await tx`CREATE OR REPLACE TRIGGER write_subject_wallet_balance INSTEAD OF INSERT OR UPDATE OR DELETE
      ON sps_rc_subject_wallet_balance FOR EACH ROW EXECUTE FUNCTION sps_rc_write_subject_wallet_balance()`;
  });
}

try {
  await migrate();
} finally {
  await db.end();
}
