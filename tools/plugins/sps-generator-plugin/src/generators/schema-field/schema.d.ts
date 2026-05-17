export interface SchemaFieldGeneratorSchema {
  name: string;
  model_name: string;
  module: string;
  pg_core_type:
    | "real"
    | "serial"
    | "uuid"
    | "bigint"
    | "text"
    | "boolean"
    | "timestamp"
    | "jsonb"
    | "json"
    | "integer"
    | "date"
    | "time"
    | "number";
  action: "create" | "remove";
  level: "singlepage" | "startup";
  is_required: boolean;
}
