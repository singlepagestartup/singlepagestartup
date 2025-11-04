export interface RelationGeneratorSchema {
  action: "create" | "remove";
  relation_name: string;
  left_model_name: string;
  left_module_name: string;
  right_model_name: string;
  right_module_name: string;
  module: string;
}
