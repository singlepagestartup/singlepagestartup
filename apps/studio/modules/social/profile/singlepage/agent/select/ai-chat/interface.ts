export const variant = "agent-select-ai-chat";

export interface IThreadAgentSelectProps {
  variant?: "agent-select-ai-chat";
  onChange: (selected: boolean) => void;
}

type IVariantInputs = NonNullable<IThreadAgentSelectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "agent-select-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
