"use client";

import React, { useMemo, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sps/shadcn";
import { Component as PageSpsLiteAdminTable } from "@sps/sps-website-builder-models-page-frontend-component-variants-sps-lite-admin-table";
import { Component as LayoutSpsLiteAdminTable } from "@sps/sps-website-builder-models-layout-frontend-component-variants-sps-lite-admin-table";
import { Component as WidgetSpsLiteAdminTable } from "@sps/sps-website-builder-models-widget-frontend-component-variants-sps-lite-admin-table";
import { Component as HeroSectionBlockSpsLiteAdminTable } from "@sps/sps-website-builder-models-hero-section-block-frontend-component-variants-sps-lite-admin-table";
import { Component as NavbarSpsLiteAdminTable } from "@sps/sps-website-builder-models-navbar-frontend-component-variants-sps-lite-admin-table";
import { Component as FooterSpsLiteAdminTable } from "@sps/sps-website-builder-models-footer-frontend-component-variants-sps-lite-admin-table";
import { Component as LogotypeSpsLiteAdminTable } from "@sps/sps-website-builder-models-logotype-frontend-component-variants-sps-lite-admin-table";
import { Component as ButtonSpsLiteAdminTable } from "@sps/sps-website-builder-models-button-frontend-component-variants-sps-lite-admin-table";
import { Component as NavbarBlockSpsLiteAdminTable } from "@sps/sps-website-builder-models-navbar-block-frontend-component-variants-sps-lite-admin-table";
import { Component as FooterBlockSpsLiteAdminTable } from "@sps/sps-website-builder-models-footer-block-frontend-component-variants-sps-lite-admin-table";
import { Component as SliderBlockSpsLiteAdminTable } from "@sps/sps-website-builder-models-slider-block-frontend-component-variants-sps-lite-admin-table";
import { Component as SliderSpsLiteAdminTable } from "@sps/sps-website-builder-models-slider-frontend-component-variants-sps-lite-admin-table";
import { Component as SlideSpsLiteAdminTable } from "@sps/sps-website-builder-models-slide-frontend-component-variants-sps-lite-admin-table";
import { Component as FeaturesSectionBlockSpsLiteAdminTable } from "@sps/sps-website-builder-models-features-section-block-frontend-component-variants-sps-lite-admin-table";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";

export function Component(props: IComponentPropsExtended) {
  const [page, setPage] = useState<{
    model: (typeof models)[0];
  }>();

  const models = useMemo(() => {
    return [
      {
        name: "widget",
        Comp: WidgetSpsLiteAdminTable,
      },
      {
        name: "button",
        Comp: ButtonSpsLiteAdminTable,
      },
      {
        name: "buttons-array",
      },
      {
        name: "checkout-form-block",
      },
      {
        name: "contact-section-block",
      },
      {
        name: "edit-subscription-block",
      },
      {
        name: "feature",
      },
      {
        name: "features-section-block",
        Comp: FeaturesSectionBlockSpsLiteAdminTable,
      },
      {
        name: "flyout",
      },
      {
        name: "font",
      },
      {
        name: "footer",
        Comp: FooterSpsLiteAdminTable,
      },
      {
        name: "footer-block",
        Comp: FooterBlockSpsLiteAdminTable,
      },
      {
        name: "hero-section-block",
        Comp: HeroSectionBlockSpsLiteAdminTable,
      },
      {
        name: "layout",
        Comp: LayoutSpsLiteAdminTable,
      },
      {
        name: "loader",
      },
      {
        name: "locale",
      },
      {
        name: "logotype",
        Comp: LogotypeSpsLiteAdminTable,
      },
      {
        name: "logotypes-list-block",
      },
      {
        name: "metatag",
      },
      {
        name: "modal",
      },
      {
        name: "navbar",
        Comp: NavbarSpsLiteAdminTable,
      },
      {
        name: "navbar-block",
        Comp: NavbarBlockSpsLiteAdminTable,
      },
      {
        name: "not-found-block",
      },
      {
        name: "page",
        Comp: PageSpsLiteAdminTable,
      },
      {
        name: "products-list-block",
      },
      {
        name: "reviews-list-block",
      },
      {
        name: "shopping-cart-block",
      },
      {
        name: "sidebar",
      },
      {
        name: "slide",
        Comp: SlideSpsLiteAdminTable,
      },
      {
        name: "slide-over",
      },
      {
        name: "slider",
        Comp: SliderSpsLiteAdminTable,
      },
      {
        name: "slider-block",
        Comp: SliderBlockSpsLiteAdminTable,
      },
      {
        name: "subscription-checkout-form-block",
      },
      {
        name: "theme",
      },
      {
        name: "tiers-list-block",
      },
      {
        name: "topbar",
      },
    ];
  }, []);

  const RenderWidget = useMemo(() => {
    if (page) {
      const model = models.find((m) => m.name === page.model.name);

      if (model && "Comp" in model && model.Comp) {
        return model.Comp;
      }
    }

    return null;
  }, [page, models]);

  return (
    <div
      data-module="sps-website-builder"
      data-model="page"
      data-variant={props.variant}
      className="w-full flex bg-white border border-muted rounded-lg"
    >
      <div className="w-3/12 flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-3">
          {models
            .filter((model) => model.Comp)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((model, modelIndex) => {
              let hasComponent = false;

              if ("Comp" in model && model.Comp) {
                hasComponent = true;
              }

              return (
                <Button
                  variant={
                    page?.model.name === model.name ? "primary" : "ghost"
                  }
                  className="text-left justify-start"
                  disabled={!hasComponent}
                  onClick={() => {
                    setPage({
                      model,
                    });
                  }}
                  key={modelIndex}
                >
                  {model.name}
                </Button>
              );
            })}
          <div className="flex flex-col gap-3">
            <Collapsible>
              <CollapsibleTrigger asChild={true}>
                <Button
                  variant="link"
                  className="text-left justify-start gap-3"
                >
                  Not finished models
                  <ChevronUpDownIcon className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {models
                  .filter((model) => !model.Comp)
                  .map((model, modelIndex) => {
                    let hasComponent = false;

                    if ("Comp" in model && model.Comp) {
                      hasComponent = true;
                    }

                    return (
                      <Button
                        variant="ghost"
                        className="text-left justify-start"
                        disabled={!hasComponent}
                        onClick={() => {
                          setPage({
                            model,
                          });
                        }}
                        key={modelIndex}
                      >
                        {model.name}
                      </Button>
                    );
                  })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
      <div className="w-9/12 flex flex-col gap-6 p-4">
        {typeof RenderWidget === "function" ? (
          <RenderWidget {...({} as any)} />
        ) : null}
      </div>
    </div>
  );
}
