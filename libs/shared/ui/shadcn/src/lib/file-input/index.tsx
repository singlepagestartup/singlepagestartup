"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import Image from "next/image";
import React, {
  ChangeEvent,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { UseFormReturn } from "react-hook-form";
export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "form"> {
  form: UseFormReturn<any>;
  children?: ReactNode;
  className?: string;
}

interface FileValueProps {
  file: File;
  onDelete: (file: File) => void;
}

const FileInputContext = createContext<{
  fileSetted: boolean;
  setFileSetted: (fileSetted: boolean) => void;
}>({
  fileSetted: false,
  setFileSetted: () => {},
});

const FileValue = React.forwardRef<HTMLDivElement, FileValueProps>(
  (props, ref) => {
    const { file, onDelete } = props;

    const url = URL.createObjectURL(file);
    const isImage = file.type?.includes("image");

    return (
      <button
        className="overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file);
        }}
      >
        {isImage ? (
          <Image src={url} alt="" fill={true} className="object-contain" />
        ) : (
          <div className="">
            <p>{file?.name}</p>
          </div>
        )}
      </button>
    );
  },
);

const FileInputRoot = React.forwardRef<HTMLDivElement, FileInputProps>(
  (props, ref) => {
    const [fileSetted, setFileSetted] = React.useState<boolean>(false);
    return (
      <FileInputContext.Provider
        value={{
          fileSetted,
          setFileSetted,
        }}
      >
        <FileInput {...props} />
      </FileInputContext.Provider>
    );
  },
);

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, type, children, ...props }, ref) => {
    const context = useContext(FileInputContext);

    const fileRef = props.form?.register(props?.name || "");
    const localRef = useRef<HTMLInputElement>(null);

    const [localFile, setLocalFile] = React.useState<File | null>();

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (props.onChange) {
        if (e.target?.files?.length) {
          const files = e.target.files ?? undefined;

          setLocalFile(files[0] as unknown as File);

          props.onChange(files[0] as unknown as ChangeEvent<HTMLInputElement>);
          context.setFileSetted(true);
        }
      }
    }

    useEffect(() => {
      if (typeof props.value === "string") {
        fetch(props.value)
          .then((response) => response.blob())
          .then((blob) => {
            const dataTransfer = new DataTransfer();
            const evt = new InputEvent("change");

            if (typeof props.value !== "string") {
              return;
            }

            const splittedPath = props.value?.split("/");
            const fileName = splittedPath[splittedPath.length - 1];
            const type = blob.type;

            if (!type || type === "text/html") {
              return;
            }

            const file = new File([blob], fileName || "file", {
              type,
            });

            if (localRef?.current) {
              dataTransfer.items.add(file);
              localRef.current.files = dataTransfer.files;
              localRef.current.dispatchEvent(evt);
              onChange(evt as unknown as ChangeEvent<HTMLInputElement>);
              context.setFileSetted(true);
            }
          })
          .catch((error) => {
            console.log("shadcn file input ~ useEffect ~ error:", error);
          });
      }
    }, [props.value]);

    return (
      <div
        className={cn(
          "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative aspect-w-2 aspect-h-2 cursor-pointer",
          className,
        )}
      >
        <label
          htmlFor={props.id || "file"}
          className={cn(
            "",
            localFile ? "" : "absolute inset-0 z-10",
            className,
          )}
        ></label>
        <input
          type="file"
          {...props}
          id={props.id || "file"}
          form=""
          {...fileRef}
          ref={localRef}
          className="hidden"
          value=""
          onChange={onChange}
        />
        <InputContent
          {...props}
          file={localFile}
          onDelete={(e) => {
            setLocalFile(null);
            if (props.onChange) {
              const emptyEvent = new InputEvent("change");

              if (localRef?.current) {
                localRef.current.files = new DataTransfer().files;
                localRef.current.dispatchEvent(emptyEvent);
                props.onChange(
                  emptyEvent as unknown as ChangeEvent<HTMLInputElement>,
                );
              }
            }
            context.setFileSetted(false);
          }}
        />
        <InputPlaceholder />
      </div>
    );
  },
);

type InputPlaceholderProps = {
  className?: string;
  children?: ReactNode;
};

const InputPlaceholder = React.forwardRef<
  HTMLInputElement,
  InputPlaceholderProps
>(({ className, children, ...props }, ref) => {
  const context = useContext(FileInputContext);
  if (context.fileSetted) {
    return;
  }

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {children || "Select file"}
    </div>
  );
});

export type FileInputContentProps = {
  className?: string;
  children?: ReactNode;
  file?: File | null | undefined;
  onDelete: (file: File) => void;
};

const InputContent = React.forwardRef<HTMLDivElement, FileInputContentProps>(
  ({ className, children, file, onDelete, ...props }, ref) => {
    if (!file) {
      return;
    }

    return (
      <FileValue
        {...props}
        file={file}
        onDelete={(e) => {
          onDelete(file);
        }}
      />
    );
  },
);

FileInput.displayName = "FileInput";

export { FileInputRoot, FileInput, FileValue };
