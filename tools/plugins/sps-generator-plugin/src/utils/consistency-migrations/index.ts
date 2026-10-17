/** Generated infrastructure SQL. Model associations come from existing Tables. */
import { CONSISTENCY_COLLECTION_SHARDS } from "@sps/shared-utils";
export function captureFunctionsSQL(): string {
  return `
INSERT INTO sps_consistency.state (id,value) VALUES ('epoch',gen_random_uuid()::text) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION sps_consistency.bump(capture_keys text[]) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE k text;
BEGIN
  FOR k IN SELECT DISTINCT unnest(capture_keys) ORDER BY 1 LOOP
    INSERT INTO sps_consistency.generation(key,version) VALUES(k,1)
      ON CONFLICT(key) DO UPDATE SET version=sps_consistency.generation.version+1;
  END LOOP;
  INSERT INTO sps_consistency.outbox(operation_id,keys)
    VALUES(coalesce(nullif(current_setting('sps.operation_id',true),''),pg_current_xact_id()::text),to_jsonb(capture_keys));
  PERFORM pg_notify('sps_consistency','changed');
END $fn$;
CREATE OR REPLACE FUNCTION sps_consistency.capture() RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE resource text := TG_TABLE_SCHEMA||'.'||TG_TABLE_NAME;
  uuid_columns text[] := ARRAY(SELECT jsonb_array_elements_text(coalesce(TG_ARGV[0],'[]')::jsonb));
  row_data jsonb; item record; ks text[] := ARRAY[]::text[]; old_data jsonb; new_data jsonb; shard integer;
BEGIN
  IF TG_OP='TRUNCATE' THEN
    PERFORM sps_consistency.bump(ARRAY[resource||'|reset']);
    RETURN NULL;
  END IF;
  IF TG_OP <> 'INSERT' THEN old_data := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN new_data := to_jsonb(NEW); END IF;
  IF old_data IS NOT DISTINCT FROM new_data THEN RETURN NULL; END IF;
  FOR row_data IN SELECT v FROM (VALUES(old_data),(new_data)) AS rows(v) WHERE v IS NOT NULL LOOP
    shard := get_byte(sha256(convert_to(coalesce(row_data->>'id',row_data::text),'UTF8')),0)%${CONSISTENCY_COLLECTION_SHARDS};
    ks := array_append(ks,resource||'|*|'||shard::text);
    FOR item IN SELECT key,value FROM jsonb_each(row_data) WHERE jsonb_typeof(value)='string' AND key=ANY(uuid_columns) LOOP
      ks := array_append(ks,resource||'|'||item.key||'|'||encode(sha256(convert_to(item.value#>>'{}','UTF8')),'hex'));
    END LOOP;
  END LOOP;
  PERFORM sps_consistency.bump(ks);
  RETURN NULL;
END $fn$;
CREATE OR REPLACE FUNCTION sps_consistency.install_capture(resource_name text, resource_topic text, resource_columns jsonb) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE schema_name text:=split_part(resource_name,'.',1); table_name text:=split_part(resource_name,'.',2); uuid_columns jsonb;
BEGIN
  IF schema_name='sps_consistency' OR schema_name IN ('pg_catalog','information_schema','drizzle') THEN
    RAISE EXCEPTION 'Infrastructure capture is prohibited';
  END IF;
  INSERT INTO sps_consistency.resource(resource,topic,columns) VALUES(resource_name,resource_topic,resource_columns)
    ON CONFLICT(resource) DO UPDATE SET topic=excluded.topic,columns=excluded.columns;
  IF to_regclass(format('%I.%I',schema_name,table_name)) IS NOT NULL THEN
    SELECT coalesce(jsonb_agg(attname),'[]'::jsonb) INTO uuid_columns FROM pg_attribute WHERE attrelid=to_regclass(resource_name) AND atttypid='uuid'::regtype AND attnum>0 AND NOT attisdropped;
    EXECUTE format('DROP TRIGGER IF EXISTS sps_consistency_rows ON %I.%I',schema_name,table_name);
    EXECUTE format('CREATE TRIGGER sps_consistency_rows AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION sps_consistency.capture(%L)',schema_name,table_name,uuid_columns::text);
    EXECUTE format('DROP TRIGGER IF EXISTS sps_consistency_truncate ON %I.%I',schema_name,table_name);
    EXECUTE format('CREATE TRIGGER sps_consistency_truncate AFTER TRUNCATE ON %I.%I FOR EACH STATEMENT EXECUTE FUNCTION sps_consistency.capture()',schema_name,table_name);
  END IF;
END $fn$;
`;
}

export function installCaptureSQL(props: {
  resource: string;
  topic: string;
  columns: Record<string, string>;
}): string {
  const literal = (v: string) => "'" + v.replaceAll("'", "''") + "'";
  return `SELECT sps_consistency.install_capture(${literal(props.resource)},${literal(props.topic)},${literal(JSON.stringify(props.columns))}::jsonb);`;
}
