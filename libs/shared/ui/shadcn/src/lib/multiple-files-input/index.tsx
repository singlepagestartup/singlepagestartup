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

export interface MultipleFilesInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "form" | "onChange"
  > {
  form: UseFormReturn<any>;
  children?: ReactNode;
  className?: string;
  onFilesChange?: (files: File[]) => void;
}

interface MultipleFileValueProps {
  file: File;
  onDelete: (file: File) => void;
}

const MultipleFilesInputContext = createContext<{
  fileSetted: boolean;
  setFileSetted: (fileSetted: boolean) => void;
}>({
  fileSetted: false,
  setFileSetted: () => {},
});

const MultipleFilesInputValue = React.forwardRef<
  HTMLDivElement,
  MultipleFileValueProps
>(({ file, onDelete }, ref) => {
  const url = URL.createObjectURL(file);
  const isImage = file.type?.includes("image");

  return (
    <div className="relative w-20 h-20 border rounded overflow-hidden">
      {isImage ? (
        <Image src={url} alt="" fill className="object-cover" />
      ) : (
        <div className="flex items-center justify-center h-full text-sm">
          {file.name}
        </div>
      )}
      <button
        className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file);
        }}
      >
        ×
      </button>
    </div>
  );
});

const MultipleFilesInputRoot = React.forwardRef<
  HTMLDivElement,
  MultipleFilesInputProps
>((props, ref) => {
  const [fileSetted, setFileSetted] = React.useState<boolean>(false);
  return (
    <MultipleFilesInputContext.Provider
      value={{
        fileSetted,
        setFileSetted,
      }}
    >
      <MultipleFilesInput {...props} />
    </MultipleFilesInputContext.Provider>
  );
});

const MultipleFilesInput = React.forwardRef<
  HTMLInputElement,
  MultipleFilesInputProps
>(({ className, type, children, ...props }, ref) => {
  const context = useContext(MultipleFilesInputContext);

  const fileRef = props.form?.register(props?.name || "");
  const localRef = useRef<HTMLInputElement>(null);

  const [localFiles, setLocalFiles] = React.useState<File[]>([]);

  useEffect(() => {
    props.form.setValue(props.name || "", localFiles);
  }, [localFiles, props.form, props.name]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target?.files?.length) {
      const newFiles = Array.from(e.target.files);
      setLocalFiles((prev) => {
        const updated = [...prev, ...newFiles];
        if (props.onFilesChange) {
          props.onFilesChange(updated);
        }
        return updated;
      });
      context.setFileSetted(true);
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
            setLocalFiles([file]);
            context.setFileSetted(true);
          }
        })
        .catch((error) => {
          console.log("shadcn file input ~ useEffect ~ error:", error);
        });
    }
  }, [props.value]);

  return (
    <div className={cn("flex gap-2", className)}>
      <div className="w-20 h-20 border rounded cursor-pointer relative bg-background">
        <label
          htmlFor={props.id || "file"}
          className="absolute inset-0 flex items-center justify-center text-sm"
        >
          Select files
        </label>
        <input
          type="file"
          multiple
          {...props}
          id={props.id || "file"}
          form=""
          {...fileRef}
          ref={localRef}
          className="hidden"
          value=""
          onChange={onChange}
        />
      </div>
      <InputContent
        files={localFiles}
        onDelete={(f) => {
          const updated = localFiles.filter((fi) => fi !== f);
          setLocalFiles(updated);
          if (props.onFilesChange) {
            props.onFilesChange(updated);
          }
        }}
      />
    </div>
  );
});

export type MultipleFilesInputContentProps = {
  className?: string;
  children?: ReactNode;
  files?: File[];
  onDelete: (file: File) => void;
};

const InputContent = React.forwardRef<
  HTMLDivElement,
  MultipleFilesInputContentProps
>(({ files, onDelete }, ref) => {
  if (!files?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <MultipleFilesInputValue key={index} file={file} onDelete={onDelete} />
      ))}
    </div>
  );
});

MultipleFilesInput.displayName = "MultipleFilesInput";

export { MultipleFilesInputRoot, MultipleFilesInput, MultipleFilesInputValue };
