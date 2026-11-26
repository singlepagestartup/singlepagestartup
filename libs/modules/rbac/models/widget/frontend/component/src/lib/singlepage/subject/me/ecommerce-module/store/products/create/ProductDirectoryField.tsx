import type { IStoreCatalogDirectoryItem } from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
import { X } from "lucide-react";
import { memo, useCallback, type Dispatch, type SetStateAction } from "react";
import { DirectoryPicker } from "../directories/DirectoryPicker";
import { directoryItemLabel, directoryTitles } from "../directories/labels";

interface IProps {
  kind: "categories" | "attributes";
  subjectId: string;
  storeId: string;
  language: string;
  selected: IStoreCatalogDirectoryItem[];
  onChange: Dispatch<SetStateAction<IStoreCatalogDirectoryItem[]>>;
}

const SelectedItem = memo(function SelectedItem({
  item,
  language,
  onRemove,
}: {
  item: IStoreCatalogDirectoryItem;
  language: string;
  onRemove: (id: string) => void;
}) {
  const label = directoryItemLabel(item, language);
  return (
    <li className="max-w-full">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-auto max-w-full gap-1.5 whitespace-normal rounded-full py-1.5 text-left"
        aria-label={`${language === "ru" ? "Убрать" : "Remove"} · ${label}`}
        onClick={() => onRemove(item.id)}
      >
        {label}
        <X aria-hidden="true" className="size-3.5 shrink-0" />
      </Button>
    </li>
  );
});

export function ProductDirectoryField({
  kind,
  subjectId,
  storeId,
  language,
  selected,
  onChange,
}: IProps) {
  const titles =
    kind === "attributes"
      ? { ru: "Характеристики предложения", en: "Offer attributes" }
      : directoryTitles[kind];
  const title = titles[language === "ru" ? "ru" : "en"];
  const select = useCallback(
    (item: IStoreCatalogDirectoryItem) => {
      onChange((before) =>
        before.some(({ id }) => id === item.id) ? before : [...before, item],
      );
    },
    [onChange],
  );
  const remove = useCallback(
    (id: string) =>
      onChange((before) => before.filter((item) => item.id !== id)),
    [onChange],
  );

  return (
    <div className="grid min-w-0 content-start gap-3">
      <DirectoryPicker
        subjectId={subjectId}
        storeId={storeId}
        kind={kind}
        language={language}
        label={title}
        onSelect={select}
        disabledIds={selected.map(({ id }) => id)}
        disabled={selected.length >= 100}
      />
      {selected.length > 0 && (
        <ul aria-label={title} className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <SelectedItem
              key={item.id}
              item={item}
              language={language}
              onRemove={remove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
