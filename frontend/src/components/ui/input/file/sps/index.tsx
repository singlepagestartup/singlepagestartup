import {
  CloudArrowUpIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import {
  MutableRefObject,
  forwardRef,
  useEffect,
  useState,
  ChangeEvent,
} from "react";
import getFileUrl from "~utils/api/get-file-url";
import { IEntity as IBackendFile } from "~redux/services/backend/extensions/upload/api/file/interfaces";
import { ExtendedInputProps } from "../..";

interface Props extends ExtendedInputProps<"file"> {}

const FileInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const ButtonComp = DefaultButton;
  const [localFiles, setLocalFiles] = useState<File[] | null>();

  // https://stackoverflow.com/questions/70683188/react-forwardref-property-current-does-not-exist-on-type-forwardedrefhtmlel
  const formInputRef = ref as MutableRefObject<HTMLInputElement>;

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    let filesArray: File[] = [];
    const target = e.target as HTMLInputElement;

    if (target?.files) {
      filesArray = Array.from(target.files);
    }

    setLocalFiles((prev) => {
      if (!prev) {
        return filesArray;
      }

      return [...prev, ...filesArray];
    });

    // For fixing
    // Failed to set the 'value' property on 'HTMLInputElement': This input element accepts a filename, which may only be programmatically set to the empty string.
    props.onChange(e);
  }

  useEffect(() => {
    const files = formInputRef?.current?.files;
    if (!localFiles) {
      if (files) {
        const filesArray = Array.from(files);
        if (filesArray.length) {
          setLocalFiles(filesArray);
        }
      }
    }
  }, [JSON.stringify(formInputRef.current?.files)]);

  useEffect(() => {
    if (localFiles) {
      const evt = new InputEvent("change");
      const changeEvent = evt as unknown as ChangeEvent<HTMLInputElement>;
      formInputRef.current.dispatchEvent(evt);
      props.onChange(changeEvent, localFiles);
    }
  }, [JSON.stringify(localFiles)]);

  function onFileDeleteByIndex(deleteIndex: number) {
    if (!localFiles?.length) {
      return;
    }

    setLocalFiles((prev) => {
      if (!Array.isArray(prev)) {
        return prev;
      }

      const ns: File[] = [...prev];
      return ns.filter((_, i) => i !== deleteIndex);
    });
  }

  return (
    <div
      data-ui="input"
      data-ui-variant="file"
      className={props.className || ""}
    >
      <label
        htmlFor={props.id}
        data-multiple={props.multiple ? true : false}
        data-filled={props.value?.length ? true : false}
        data-files={localFiles?.length ? localFiles.length : 0}
        className="input"
      >
        <input
          {...props}
          // If pass data in repeatable component, get an error
          // InvalidStateError: Failed to set the 'value' property on 'HTMLInputElement': This input element accepts a filename, which may only be programmatically set to the empty string.
          ref={ref}
          className="hidden"
          onChange={onChange}
        />
        <ButtonComp {...props} />
      </label>
      {localFiles ? (
        <FilesArray
          {...props}
          multiple={props.multiple ? true : false}
          files={localFiles}
          onFileDelete={onFileDeleteByIndex}
        />
      ) : null}
    </div>
  );
});

export default FileInput;

function DefaultButton({ media, placeholder }: Props) {
  return (
    <div className="button">
      <div className="button-container">
        <div className="icon-container">
          {media?.length ? (
            <Image src={getFileUrl(media[0])} fill={true} alt="" />
          ) : (
            <CloudArrowUpIcon />
          )}
        </div>
        <p>{placeholder}</p>
      </div>
    </div>
  );
}

function FilesArray(props: {
  multiple: boolean;
  files?: File[];
  onFileDelete: any;
  additionalMedia?: IBackendFile[] | null;
}) {
  const { files, onFileDelete, multiple, additionalMedia } = props;

  return (
    <div
      data-multiple={multiple}
      data-files={files?.length}
      className="files-array"
    >
      {files?.map((file, index) => {
        const url = URL.createObjectURL(file);
        const isImage = file.type.includes("image");

        return (
          <div key={index} className="file">
            {isImage ? (
              <Image src={url} alt="" fill={true} />
            ) : (
              <div className="file__description">
                <p>{file?.name}</p>
              </div>
            )}

            <button
              onClick={(e) => {
                onFileDelete(index);
              }}
              className="delete-button"
            >
              <div className="icon-container">
                {additionalMedia?.length ? (
                  <Image
                    src={getFileUrl(additionalMedia[0])}
                    fill={true}
                    alt=""
                  />
                ) : (
                  <TrashIcon />
                )}
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DeafultResetIcon() {
  return <XMarkIcon />;
}
