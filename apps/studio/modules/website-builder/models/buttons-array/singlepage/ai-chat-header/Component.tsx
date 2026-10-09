import { Component as ArrayButtons } from "../../../../relations/buttons-arrays-to-buttons/singlepage/ai-chat-find/index";
import { Component as Button } from "../../../button/singlepage/ai-chat-header/index";

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
      <ArrayButtons
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
            <Button
              key={relation.id}
              id={relation.buttonId}
              activeHref={activeHref}
              onNavigate={onNavigate}
            />
          ))
        }
      </ArrayButtons>
    </div>
  );
}
