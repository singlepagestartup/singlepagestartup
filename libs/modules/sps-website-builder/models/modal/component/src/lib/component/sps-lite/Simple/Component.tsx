import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
// import { Component as PageBlocks } from "../../../../../components/page-blocks/component";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const { isOpenModal, closeModal, dialogPanelClassName } = props;

  return (
    <Transition show={isOpenModal} as={"div"}>
      <Dialog
        onClose={() => {
          closeModal();
        }}
        data-collection-type="modal"
        data-variant={props.variant}
        className={props.className || ""}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="backdrop" aria-hidden="true" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-out duration-300"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          {props.data.pageBlocks ? (
            <div className="modal-container">
              <Dialog.Panel
                className={`dialog-panel ${
                  props.dialogPanelClassName || "w-full"
                }`}
              >
                <button
                  onClick={() => {
                    closeModal();
                  }}
                  className="button-close"
                >
                  <XMarkIcon />
                </button>
                {/* <PageBlocks
                  variant="default"
                  isServer={false}
                  pageBlocks={props.data}
                  closeModal={closeModal}
                /> */}
              </Dialog.Panel>
            </div>
          ) : null}
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}