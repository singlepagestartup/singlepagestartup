import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component({
  title,
  description,
  copyLabel = "Copy request",
  pendingLabel = "Copying…",
  successLabel = "Request copied. Paste it into your coding agent.",
  errorLabel = "Copy was unavailable. Select and copy the request above.",
  idleLabel = "You can edit the request before using it.",
}: IComponentProps) {
  return (
    <ClientComponent
      title={title}
      description={description}
      copyLabel={copyLabel}
      pendingLabel={pendingLabel}
      successLabel={successLabel}
      errorLabel={errorLabel}
      idleLabel={idleLabel}
    />
  );
}
