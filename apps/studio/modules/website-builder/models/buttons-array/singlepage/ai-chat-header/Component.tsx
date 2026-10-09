import { Component as ButtonsArraysToButtons } from "../../../../relations/buttons-arrays-to-buttons/index";
import { Component as WebsiteBuilderModuleButton } from "../../../button/index";

export interface IHeaderButtonsProps {
  id: string;
  activeHref?: string;
  onNavigate?: () => void;
}
const buttonIds: Record<string, string> = {
  "ai-chat-help": "ai-chat-help",
  "ai-chat-login": "ai-chat-login",
  "ai-chat-register": "ai-chat-register",
};
export function Component({ id, activeHref, onNavigate }: IHeaderButtonsProps) {
  const buttonId = buttonIds[id];
  if (!buttonId) return null;
  return (
    <div
      data-ds-block="website-builder.buttons-array.ai-chat-header"
      data-module="website-builder"
      data-model="buttons-array"
      data-id={id}
      data-variant="ai-chat-header"
      className="flex items-center gap-1"
    >
      <ButtonsArraysToButtons
        variant="find"
        data={[
          { id: `${id}:button`, buttonsArrayId: id, buttonId, orderIndex: 0 },
        ]}
        apiProps={{
          params: {
            filters: {
              and: [{ column: "buttonsArrayId", method: "eq", value: id }],
            },
          },
        }}
      >
        {(relations) =>
          relations.map((relation) => (
            <WebsiteBuilderModuleButton
              variant="ai-chat-header"
              key={relation.id}
              id={relation.buttonId}
              activeHref={activeHref}
              onNavigate={onNavigate}
            />
          ))
        }
      </ButtonsArraysToButtons>
    </div>
  );
}
