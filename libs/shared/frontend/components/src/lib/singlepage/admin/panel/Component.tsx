"use client";

import React, { ComponentType, useMemo, useState } from "react";
import { Button } from "@sps/shared-ui-shadcn";
import { ChevronsUpDown } from "lucide-react";

type IRenderComponent = ComponentType<any>;

export interface IComponentProps {
  className?: string;
  module: string;
  isServer: boolean;
  name: string;
  models: {
    name: string;
    Comp: IRenderComponent;
  }[];
}

export function Component(props: IComponentProps) {
  const [show, setShow] = useState(true);
  const [page, setPage] = useState<{
    model: (typeof props.models)[0];
  }>();

  const RenderWidget: IRenderComponent | undefined = useMemo(() => {
    if (page) {
      const model = props.models.find((m) => m.name === page.model.name);

      if (model && "Comp" in model && model["Comp"]) {
        return model.Comp;
      }
    }

    return;
  }, [page, props.models]);

  return (
    <div
      data-module="website-builder"
      data-component="admin"
      className="w-full flex flex-col lg:flex-row"
    >
      <div className="w-full lg:w-3/12 p-4 pt-6">
        <div className="relative gap-6 rounded-lg border border-input w-full bg-input">
          <div className="flex absolute top-0 inset-x-0 px-4 transform -translate-y-1/2 justify-between items-center">
            <Button size="sm" variant="outline" className="gap-2 w-fit">
              models
            </Button>
            <Button
              onClick={() => {
                setShow(!show);
              }}
              variant="outline"
              size="sm"
              className="gap-2 w-fit"
            >
              <ChevronsUpDown className="h-3 w-3" /> {show ? "Hide" : "Show"}
            </Button>
          </div>
          <div
            data-show={show}
            className="data-[show=true]:flex data-[show=false]:hidden"
          >
            <div className="pt-6 p-4 w-full flex flex-col gap-1">
              {props.models
                .filter((model) => model.Comp)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((model, modelIndex) => {
                  return (
                    <Button
                      variant="outline"
                      data-active={page?.model.name === model.name}
                      className="data-[active=true]:bg-primary data-[active=true]:text-background w-full text-left items-start justify-start"
                      onClick={() => {
                        setPage({
                          model,
                        });
                      }}
                      key={modelIndex}
                    >
                      <p className="max-w-full text-ellipsis overflow-hidden">
                        {model.name}
                      </p>
                    </Button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-9/12 flex flex-col gap-6 p-4 pt-6">
        {RenderWidget && typeof RenderWidget === "function" ? (
          <RenderWidget isServer={false} variant="admin-table" />
        ) : null}
      </div>
    </div>
  );
}
