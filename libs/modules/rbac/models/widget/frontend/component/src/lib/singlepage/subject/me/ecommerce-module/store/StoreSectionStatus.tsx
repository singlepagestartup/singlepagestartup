import { secondaryClass } from "../../../../subject-me-crm-module-store-workspace/primitives";
import type { IStoreSession } from "./StoreSection";

interface IStoreSectionStatusProps {
  language: string;
  deniedMessage: string;
  session: IStoreSession;
}

export function StoreSectionStatus({
  language,
  deniedMessage,
  session,
}: IStoreSectionStatusProps) {
  const ru = language === "ru";
  if (session.pending) {
    return <p role="status">{ru ? "Проверяем доступ…" : "Checking access…"}</p>;
  }
  if (session.retry) {
    return (
      <div className="grid gap-3">
        <p role="alert">
          {ru ? "Не удалось проверить доступ." : "Could not check your access."}
        </p>
        <button
          type="button"
          className={`${secondaryClass} w-fit`}
          onClick={session.retry}
        >
          {ru ? "Повторить" : "Retry"}
        </button>
      </div>
    );
  }
  return <p role="alert">{deniedMessage}</p>;
}
