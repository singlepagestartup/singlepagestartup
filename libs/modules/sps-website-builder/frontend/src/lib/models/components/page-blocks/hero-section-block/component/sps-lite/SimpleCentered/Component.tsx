import Image from "next/image";
import { Component as Button } from "../../../../../elements/button/component";
import { getFileUrl } from "@sps/utils";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { IComponentPropsExtended } from "../../interface";
import { Button as UiButton } from "@sps/ui-adapter";
import { Component as Flyout } from "../../../../../../entities/flyout/component";

export default function Component(props: IComponentPropsExtended) {
  return (
    <div className="relative flex flex-col items-center justify-between overflow-hidden bg-white mx-auto max-w-7xl">
      {props.additionalMedia?.length ? (
        <Image
          src={getFileUrl(props.additionalMedia[0])}
          alt=""
          fill={true}
          className="object-cover object-center"
        />
      ) : null}

      <div className="relative pt-6 pb-16">
        <main className="mx-auto mt-16 max-w-2xl lg:max-w-7xl px-4 sm:mt-24">
          <div className="text-center">
            {props?.title ? (
              <h1 className="text-4xl font-bold tracking-tight xl:inline text-gray-900 sm:text-5xl md:text-6xl">
                <ReactMarkdown>{props?.title}</ReactMarkdown>
              </h1>
            ) : null}
            {props?.description ? (
              <ReactMarkdown className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
                {props?.description}
              </ReactMarkdown>
            ) : null}
            <div className="mx-auto mt-5 max-w-md flex flex-col sm:flex-row justify-center md:mt-8 gap-4">
              {props?.buttons?.map((button, index) => {
                return (
                  <Button isServer={props.isServer} key={index} {...button} />
                );
              })}
            </div>

            {/* {props.title === "Sidebar" ? (
              <Flyout isServer={true} variant="simple" id={2}>
                <UiButton
                  ui="shadcn"
                  data-component="elements.button"
                  variant="default"
                >
                  FLoyt
                </UiButton>
              </Flyout>
            ) : null} */}
          </div>
        </main>
      </div>
      {props.media?.length ? (
        <div className="w-full relative aspect-w-4 aspect-h-2">
          <Image
            src={getFileUrl(props.media[0])}
            alt=""
            fill={true}
            className="object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
