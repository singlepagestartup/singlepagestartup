import { secondaryClass } from "../../../../../subject-me-crm-module-store-workspace/primitives";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";

interface IProductStatusProps {
  language: string;
  isPending: boolean;
  error: unknown;
  retry: () => void;
}

export function ProductStatus({
  language,
  isPending,
  error,
  retry,
}: IProductStatusProps) {
  const ru = language === "ru";
  if (isPending) {
    return (
      <p role="status">{ru ? "Загружаем товары…" : "Loading products…"}</p>
    );
  }
  if (hasStatus(error, 401, 403)) {
    return (
      <p role="alert">
        {ru
          ? "У вас нет доступа к товарам этого магазина."
          : "You do not have access to this store's products."}
      </p>
    );
  }
  if (hasStatus(error, 404)) {
    return (
      <p role="alert">
        {ru
          ? "Товар не найден в этом магазине."
          : "Product not found in this store."}
      </p>
    );
  }
  return (
    <div className="grid gap-2">
      <p role="alert">
        {ru ? "Не удалось загрузить товары." : "Could not load the products."}
      </p>
      <button
        type="button"
        className={`${secondaryClass} w-fit`}
        onClick={retry}
      >
        {ru ? "Повторить" : "Retry"}
      </button>
    </div>
  );
}
