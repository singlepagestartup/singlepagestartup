import { Button, MultipleFilesDropzone } from "@sps/shared-ui-shadcn";
import { STORE_PRODUCT_CREATE_MAX_IMAGES } from "@sps/shared-utils";
import { FilePreview } from "@sps/ui-adapter";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  memo,
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface IProps {
  language: string;
  files: File[];
  onChange: Dispatch<SetStateAction<File[]>>;
  disabled?: boolean;
}

const photoTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const photoExtensions = /\.(?:jpe?g|png|webp|gif|avif)$/i;
export const photoGrid =
  "grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]";
const iconButton =
  "size-8 shrink-0 rounded-md border bg-background/95 p-0 text-foreground shadow-sm";

interface IPhotoTileProps {
  id: string;
  name: string;
  file?: File;
  src?: string;
  mimeType?: string | null;
  language: string;
  first: boolean;
  last: boolean;
  busy?: boolean;
  onRemove?: (id: string) => void;
  onMove?: (id: string, direction: "up" | "down") => void;
  onDropAt?: (from: string, to: string) => void;
}

export const PhotoTile = memo(function PhotoTile({
  id,
  name,
  file,
  src,
  mimeType,
  language,
  first,
  last,
  busy,
  onRemove,
  onMove,
  onDropAt,
}: IPhotoTileProps) {
  const ru = language === "ru";
  const dragType = file
    ? "application/x-sps-selected-photo"
    : "application/x-sps-saved-photo";
  return (
    <li
      aria-busy={busy}
      className="group relative grid min-w-0 content-start gap-1 rounded-lg"
      draggable={Boolean(onDropAt) && !busy}
      onDragStart={(event) => {
        if (onDropAt) {
          event.dataTransfer.setData(dragType, id);
          event.dataTransfer.effectAllowed = "move";
        }
      }}
      onDragOver={(event) => {
        if (onDropAt && event.dataTransfer.types.includes(dragType)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(event) => {
        const from = event.dataTransfer.getData(dragType);
        if (onDropAt && from && from !== id) {
          event.preventDefault();
          onDropAt(from, id);
        }
      }}
    >
      <FilePreview
        layout="gallery"
        language={language}
        name={name}
        localFile={file}
        src={src}
        mimeType={mimeType}
      />
      {onRemove && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`${iconButton} absolute right-1.5 top-1.5 hover:bg-destructive hover:text-destructive-foreground`}
          aria-label={`${ru ? "Удалить изображение" : "Remove image"} · ${name}`}
          onClick={() => onRemove(id)}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
      {onMove && !(first && last) && (
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={iconButton}
            disabled={first}
            aria-label={`${ru ? "Переместить выше" : "Move up"} · ${name}`}
            onClick={() => onMove(id, "up")}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={iconButton}
            disabled={last}
            aria-label={`${ru ? "Переместить ниже" : "Move down"} · ${name}`}
            onClick={() => onMove(id, "down")}
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      )}
    </li>
  );
});

function fileId(file: File) {
  return JSON.stringify([file.name, file.size, file.lastModified, file.type]);
}

export function ProductPhotos({ language, files, onChange, disabled }: IProps) {
  const ru = language === "ru";
  const [error, setError] = useState("");
  const remove = useCallback(
    (id: string) =>
      onChange((before) => before.filter((file) => fileId(file) !== id)),
    [onChange],
  );
  const reorder = useCallback(
    (from: string, target: string | number) =>
      onChange((before) => {
        const at = before.findIndex((item) => fileId(item) === from);
        const to =
          typeof target === "string"
            ? before.findIndex((item) => fileId(item) === target)
            : at + target;
        if (at < 0 || to < 0 || to >= before.length || at === to) return before;
        const next = [...before];
        next.splice(to, 0, next.splice(at, 1)[0]);
        return next;
      }),
    [onChange],
  );
  const move = useCallback(
    (id: string, direction: "up" | "down") =>
      reorder(id, direction === "up" ? -1 : 1),
    [reorder],
  );

  function add(picked: File[]) {
    if (!picked.length) return;
    if (
      picked.some((file) =>
        file.type
          ? !photoTypes.includes(file.type)
          : !photoExtensions.test(file.name),
      )
    ) {
      setError(
        ru
          ? "Выберите изображения JPEG, PNG, WebP, GIF или AVIF."
          : "Choose JPEG, PNG, WebP, GIF or AVIF images.",
      );
      return;
    }
    const unique = new Map(files.map((file) => [fileId(file), file]));
    for (const file of picked) unique.set(fileId(file), file);
    if (unique.size > STORE_PRODUCT_CREATE_MAX_IMAGES) {
      setError(
        ru
          ? `Можно добавить до ${STORE_PRODUCT_CREATE_MAX_IMAGES} фотографий за раз.`
          : `Choose up to ${STORE_PRODUCT_CREATE_MAX_IMAGES} photos at a time.`,
      );
      return;
    }
    setError("");
    onChange([...unique.values()]);
  }
  return (
    <div className="grid min-w-0 gap-4">
      <MultipleFilesDropzone
        inputProps={{
          accept: photoTypes.join(","),
          "aria-label": ru ? "Добавить фотографии" : "Add photos",
        }}
        label={ru ? "Выбрать фотографии" : "Choose photos"}
        description={
          ru
            ? "Перетащите фотографии сюда или выберите файлы."
            : "Drag photos here or choose files."
        }
        formats="JPEG, PNG, WebP, GIF, AVIF"
        onFiles={add}
        disabled={disabled}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!!files.length && (
        <ul
          aria-label={ru ? "Выбранные фотографии" : "Selected photos"}
          className={photoGrid}
        >
          {files.map((file, index) => (
            <PhotoTile
              key={fileId(file)}
              id={fileId(file)}
              file={file}
              name={file.name}
              mimeType={file.type}
              language={language}
              first={index === 0}
              last={index === files.length - 1}
              onRemove={remove}
              onMove={move}
              onDropAt={disabled ? undefined : reorder}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
