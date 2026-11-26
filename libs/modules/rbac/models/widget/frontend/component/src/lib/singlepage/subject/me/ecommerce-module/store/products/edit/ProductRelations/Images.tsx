import type {
  IStoreProductRelations,
  IStoreProductUpdate,
} from "@sps/rbac/models/subject/sdk/model";
import { settingsFormStyles, Button } from "@sps/shared-ui-shadcn";
import { Upload } from "lucide-react";
import { useId, useCallback, useRef, useState } from "react";
import { PhotoTile, ProductPhotos, photoGrid } from "../../ProductPhotos";

type TImage = IStoreProductRelations["images"][number];
type TAction = NonNullable<IStoreProductUpdate["relation"]>;
interface IImagesProps {
  images: TImage[];
  language: string;
  editable: boolean;
  pendingKey?: string;
  onUpload: (file: File) => Promise<boolean>;
  onAction: (action: TAction) => Promise<boolean>;
  onRemove: (id: string) => void;
}

export function Images({
  images,
  language,
  editable,
  pendingKey,
  onUpload,
  onAction,
  onRemove,
}: IImagesProps) {
  const ru = language === "ru";
  const headingId = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const lock = useRef(false);
  const move = useCallback(
    (id: string, direction: "up" | "down") => {
      void onAction({ kind: "move-image", id, direction });
    },
    [onAction],
  );

  const dropAt = useCallback(
    (id: string, targetId: string) => {
      void onAction({ kind: "move-image", id, targetId });
    },
    [onAction],
  );

  async function upload() {
    if (lock.current || !files.length) return;
    lock.current = true;
    setUploading(true);
    try {
      for (const file of files) {
        if (!(await onUpload(file))) break;
        setFiles((before) => before.filter((item) => item !== file));
      }
    } finally {
      lock.current = false;
      setUploading(false);
    }
  }
  return (
    <section
      className={`${settingsFormStyles.panel} grid gap-5`}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={settingsFormStyles.title}>
        {ru ? "Изображения" : "Images"}
      </h2>
      {editable && (
        <fieldset
          className="grid min-w-0 gap-3"
          disabled={uploading || Boolean(pendingKey)}
        >
          <ProductPhotos
            language={language}
            files={files}
            onChange={setFiles}
            disabled={uploading || Boolean(pendingKey)}
          />
          {!!files.length && (
            <Button
              type="button"
              variant="outline"
              className={`${settingsFormStyles.secondary} w-fit`}
              onClick={() => void upload()}
            >
              <Upload aria-hidden="true" className="size-4" />
              {uploading
                ? ru
                  ? "Загрузка…"
                  : "Uploading…"
                : ru
                  ? "Сохранить фотографии"
                  : "Save photos"}
            </Button>
          )}
        </fieldset>
      )}
      {images.length > 0 ? (
        <ul
          className={photoGrid}
          aria-label={ru ? "Сохранённые изображения" : "Saved images"}
        >
          {images.map((image, index) => (
            <PhotoTile
              key={image.id}
              id={image.id}
              language={language}
              src={image.src}
              mimeType={image.mimeType}
              name={image.title || image.alt || (ru ? "Изображение" : "Image")}
              first={index === 0}
              last={index === images.length - 1}
              busy={pendingKey === image.id}
              onMove={editable ? move : undefined}
              onRemove={editable ? onRemove : undefined}
              onDropAt={
                editable && !pendingKey && !uploading ? dropAt : undefined
              }
            />
          ))}
        </ul>
      ) : (
        !editable && (
          <p className="text-sm text-muted-foreground">
            {ru
              ? "У товара пока нет изображений."
              : "This product has no images yet."}
          </p>
        )
      )}
    </section>
  );
}
