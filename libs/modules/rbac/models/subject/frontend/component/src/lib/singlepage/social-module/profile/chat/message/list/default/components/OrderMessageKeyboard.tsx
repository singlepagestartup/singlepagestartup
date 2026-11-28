import { Button } from "@sps/shared-ui-shadcn";
import type { readOrderCheckoutButtons } from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";

export type OrderMessageKeyboardRows = NonNullable<
  ReturnType<typeof readOrderCheckoutButtons>
>;

interface IProps {
  rows: OrderMessageKeyboardRows;
  onSelect: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function OrderMessageKeyboard(props: IProps) {
  return (
    <div className="mt-3 grid gap-2">
      {props.rows.map((row) => (
        <div
          key={row.map((button) => button.text).join("|")}
          className="flex flex-wrap gap-2"
        >
          {row.map((button) =>
            "url" in button ? (
              <Button key={button.url} asChild>
                <a href={button.url}>{button.text}</a>
              </Button>
            ) : (
              <Button
                key={button.callback_data}
                type="button"
                variant="outline"
                disabled={props.disabled}
                onClick={() => props.onSelect(button.callback_data)}
              >
                {button.text}
              </Button>
            ),
          )}
        </div>
      ))}
      {props.error && (
        <p role="alert" className="text-sm text-destructive">
          {props.error}
        </p>
      )}
    </div>
  );
}
