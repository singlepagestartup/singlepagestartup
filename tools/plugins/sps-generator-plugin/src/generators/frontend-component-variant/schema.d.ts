export interface FrontendComponentVariantGeneratorSchema {
  name: string;
  action: "create" | "remove";
  level: "singlepage" | "startup";
  type: "model" | "relation";
  entity: string;
  module: string;
  template?: string;
  left_model_is_external?: boolean;
  right_model_is_external?: boolean;
  left_model_name?: string;
  left_module_name?: string;
  right_model_name?: string;
  right_module_name?: string;
  path: string;
}
