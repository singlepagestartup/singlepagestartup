export interface RelationGeneratorSchema {
  action: "create" | "remove";
  left_model_name: string;
  right_model_name: string;
  module: string;
}
