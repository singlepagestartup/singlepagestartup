import Link from "next/link";
import { ComponentType, ReactNode, createElement } from "react";

import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import { api as websiteBuilderButtonApi } from "@sps/website-builder/models/button/sdk/server";
import { api as websiteBuilderButtonsArrayApi } from "@sps/website-builder/models/buttons-array/sdk/server";
import type { IModel as WebsiteBuilderButtonsArrayModel } from "@sps/website-builder/models/buttons-array/sdk/model";
import { api as websiteBuilderFeatureApi } from "@sps/website-builder/models/feature/sdk/server";
import type { IModel as WebsiteBuilderFeatureModel } from "@sps/website-builder/models/feature/sdk/model";
import { api as websiteBuilderLogotypeApi } from "@sps/website-builder/models/logotype/sdk/server";
import type { IModel as WebsiteBuilderLogotypeModel } from "@sps/website-builder/models/logotype/sdk/model";
import { api as websiteBuilderSlideApi } from "@sps/website-builder/models/slide/sdk/server";
import type { IModel as WebsiteBuilderSlideModel } from "@sps/website-builder/models/slide/sdk/model";
import { api as websiteBuilderSliderApi } from "@sps/website-builder/models/slider/sdk/server";
import type { IModel as WebsiteBuilderSliderModel } from "@sps/website-builder/models/slider/sdk/model";
import { api as websiteBuilderWidgetApi } from "@sps/website-builder/models/widget/sdk/server";
import type { IModel as WebsiteBuilderWidgetModel } from "@sps/website-builder/models/widget/sdk/model";
import { api as buttonsArraysToButtonsApi } from "@sps/website-builder/relations/buttons-arrays-to-buttons/sdk/server";
import { api as featuresToFileStorageModuleFilesApi } from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/server";
import type { IModel as FeaturesToFileStorageModuleFilesModel } from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/model";
import { api as logotypesToFileStorageModuleFilesApi } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/sdk/server";
import type { IModel as LogotypesToFileStorageModuleFilesModel } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/sdk/model";
import { api as slidersToSlidesApi } from "@sps/website-builder/relations/sliders-to-slides/sdk/server";
import { api as slidesToButtonsArraysApi } from "@sps/website-builder/relations/slides-to-buttons-arrays/sdk/server";
import type { IModel as SlidesToButtonsArraysModel } from "@sps/website-builder/relations/slides-to-buttons-arrays/sdk/model";
import { api as slidesToFileStorageModuleFilesApi } from "@sps/website-builder/relations/slides-to-file-storage-module-files/sdk/server";
import type { IModel as SlidesToFileStorageModuleFilesModel } from "@sps/website-builder/relations/slides-to-file-storage-module-files/sdk/model";
import { api as widgetsToButtonsArraysApi } from "@sps/website-builder/relations/widgets-to-buttons-arrays/sdk/server";
import type { IModel as WidgetsToButtonsArraysModel } from "@sps/website-builder/relations/widgets-to-buttons-arrays/sdk/model";
import { api as widgetsToFeaturesApi } from "@sps/website-builder/relations/widgets-to-features/sdk/server";
import type { IModel as WidgetsToFeaturesModel } from "@sps/website-builder/relations/widgets-to-features/sdk/model";
import { api as widgetsToFileStorageModuleFilesApi } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/sdk/server";
import type { IModel as WidgetsToFileStorageModuleFilesModel } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/sdk/model";
import { api as widgetsToLogotypesApi } from "@sps/website-builder/relations/widgets-to-logotypes/sdk/server";
import type { IModel as WidgetsToLogotypesModel } from "@sps/website-builder/relations/widgets-to-logotypes/sdk/model";
import { api as widgetsToSlidersApi } from "@sps/website-builder/relations/widgets-to-sliders/sdk/server";
import type { IModel as WidgetsToSlidersModel } from "@sps/website-builder/relations/widgets-to-sliders/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { TIPTAP_EMPTY_DOC, saveLanguageContext } from "@sps/shared-utils";

import { Component as FileStorageFileDefaultComponent } from "@sps/file-storage/models/file/frontend/component/src/lib/singlepage/default/Component";
import { Component as WebsiteBuilderButtonDefaultComponent } from "@sps/website-builder/models/button/frontend/component/src/lib/singlepage/default/Component";
import { Component as WebsiteBuilderContentClientComponent } from "@sps/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/ClientComponent";
import { Component as WebsiteBuilderNavbarDefaultComponent } from "@sps/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/Component";
import { Component as WebsiteBuilderSliderClientComponent } from "@sps/website-builder/models/slider/frontend/component/src/lib/singlepage/default/ClientComponent";

import { RouteRenderContext } from "../types";
import { warnSiteRuntime } from "../warnings";
import { byOrderIndex, findById, findByIds, findEntities } from "./shared";

type RelationWithFileId =
  | FeaturesToFileStorageModuleFilesModel
  | LogotypesToFileStorageModuleFilesModel
  | SlidesToFileStorageModuleFilesModel
  | WidgetsToFileStorageModuleFilesModel;

function entityClassName(entity: unknown) {
  return (entity as { className?: string | null }).className || undefined;
}

function renderVariantComponent(
  Component: ComponentType<any>,
  props: Record<string, unknown>,
) {
  return createElement(Component, props);
}

async function renderFileRelation(
  relationName: string,
  relation: RelationWithFileId,
  context: RouteRenderContext,
) {
  const file = await findById(
    fileStorageFileApi,
    relation.fileStorageModuleFileId,
  );

  if (!file?.id) {
    return null;
  }

  return (
    <div
      key={relation.id || `${relationName}-${relation.fileStorageModuleFileId}`}
      data-module="website-builder"
      data-relation={relationName}
      data-id={relation.id || ""}
      data-variant={relation.variant}
      className={cn("w-full flex", entityClassName(relation))}
    >
      {renderVariantComponent(
        FileStorageFileDefaultComponent as ComponentType<any>,
        {
          data: file,
          isServer: true,
          language: context.language,
          variant: file.variant,
        },
      )}
    </div>
  );
}

async function renderButtonsArray(
  buttonsArray: WebsiteBuilderButtonsArrayModel,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(buttonsArraysToButtonsApi, [
      {
        column: "buttonsArrayId",
        method: "eq",
        value: buttonsArray.id,
      },
    ])
  ).sort(byOrderIndex);

  const buttons = await findByIds(
    websiteBuilderButtonApi,
    relations.map((relation) => relation.buttonId),
  );
  const buttonsById = new Map(buttons.map((button) => [button.id, button]));

  return (
    <div
      data-module="website-builder"
      data-model="buttons-array"
      data-id={buttonsArray.id || ""}
      data-variant={buttonsArray.variant}
      className={cn("w-full flex", entityClassName(buttonsArray))}
    >
      {relations.map((relation) => {
        const button = buttonsById.get(relation.buttonId);

        if (!button) {
          return null;
        }

        return (
          <div
            key={relation.id || `${buttonsArray.id}-${button.id}`}
            data-module="website-builder"
            data-relation="buttons-arrays-to-buttons"
            data-id={relation.id || ""}
            data-variant={relation.variant}
            className={cn("w-full flex", entityClassName(relation))}
          >
            {renderVariantComponent(
              WebsiteBuilderButtonDefaultComponent as ComponentType<any>,
              {
                data: button,
                isServer: true,
                language: context.language,
                variant: button.variant,
              },
            )}
          </div>
        );
      })}
    </div>
  );
}

async function renderButtonsArrayRelation(
  relation: WidgetsToButtonsArraysModel | SlidesToButtonsArraysModel,
  relationName: "widgets-to-buttons-arrays" | "slides-to-buttons-arrays",
  context: RouteRenderContext,
) {
  const buttonsArray = await findById(
    websiteBuilderButtonsArrayApi,
    relation.buttonsArrayId,
  );

  if (!buttonsArray?.id) {
    return null;
  }

  return (
    <div
      key={relation.id || `${relationName}-${relation.buttonsArrayId}`}
      data-module="website-builder"
      data-relation={relationName}
      data-id={relation.id || ""}
      data-variant={relation.variant}
      className={cn("w-full flex", entityClassName(relation))}
    >
      {await renderButtonsArray(buttonsArray, context)}
    </div>
  );
}

async function renderWidgetButtonsArrayRelations(params: {
  context: RouteRenderContext;
  variant?: string;
  widgetId: string;
}) {
  const relations = (
    await findEntities(widgetsToButtonsArraysApi, [
      {
        column: "widgetId",
        method: "eq",
        value: params.widgetId,
      },
      ...(params.variant
        ? [
            {
              column: "variant",
              method: "eq",
              value: params.variant,
            },
          ]
        : []),
    ])
  ).sort(byOrderIndex);

  return Promise.all(
    relations.map((relation) =>
      renderButtonsArrayRelation(
        relation,
        "widgets-to-buttons-arrays",
        params.context,
      ),
    ),
  );
}

async function renderLogotype(
  logotype: WebsiteBuilderLogotypeModel,
  context: RouteRenderContext,
) {
  const fileRelations = (
    await findEntities(logotypesToFileStorageModuleFilesApi, [
      {
        column: "logotypeId",
        method: "eq",
        value: logotype.id,
      },
    ])
  ).sort(byOrderIndex);

  const fileNodes = await Promise.all(
    fileRelations.map((relation) =>
      renderFileRelation(
        "logotypes-to-file-storage-module-files",
        relation,
        context,
      ),
    ),
  );
  const href = saveLanguageContext(
    logotype.url || "",
    context.language,
    internationalization.languages,
  );

  return (
    <Link
      data-module="website-builder"
      data-model="logotype"
      data-id={logotype.id || ""}
      data-variant={logotype.variant}
      className={cn("w-full flex flex-col", entityClassName(logotype))}
      href={href}
    >
      {fileNodes}
    </Link>
  );
}

async function renderWidgetLogotypeRelations(
  widgetId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(widgetsToLogotypesApi, [
      {
        column: "widgetId",
        method: "eq",
        value: widgetId,
      },
    ])
  ).sort(byOrderIndex);

  const logotypes = await findByIds(
    websiteBuilderLogotypeApi,
    relations.map((relation) => relation.logotypeId),
  );
  const logotypesById = new Map(
    logotypes.map((logotype) => [logotype.id, logotype]),
  );

  return Promise.all(
    relations.map(async (relation) => {
      const logotype = logotypesById.get(relation.logotypeId);

      if (!logotype) {
        return null;
      }

      return (
        <div
          key={relation.id || `${widgetId}-${logotype.id}`}
          data-module="website-builder"
          data-relation="widgets-to-logotypes"
          data-id={relation.id || ""}
          data-variant={relation.variant}
          className={cn("w-full flex", entityClassName(relation))}
        >
          {await renderLogotype(logotype, context)}
        </div>
      );
    }),
  );
}

async function renderSlide(
  slide: WebsiteBuilderSlideModel,
  context: RouteRenderContext,
) {
  const fileRelations = (
    await findEntities(slidesToFileStorageModuleFilesApi, [
      {
        column: "slideId",
        method: "eq",
        value: slide.id,
      },
    ])
  ).sort(byOrderIndex);

  const buttonsArrayRelations = (
    await findEntities(slidesToButtonsArraysApi, [
      {
        column: "slideId",
        method: "eq",
        value: slide.id,
      },
    ])
  ).sort(byOrderIndex);

  const fileNodes = await Promise.all(
    fileRelations.map((relation) =>
      renderFileRelation(
        "slides-to-file-storage-module-files",
        relation,
        context,
      ),
    ),
  );
  const buttonsNodes = await Promise.all(
    buttonsArrayRelations.map((relation) =>
      renderButtonsArrayRelation(relation, "slides-to-buttons-arrays", context),
    ),
  );

  const href = saveLanguageContext(
    slide.url || "",
    context.language,
    internationalization.languages,
  );

  const content = (
    <div className="relative min-h-80 w-full flex flex-col items-center justify-center gap-10">
      <div className="absolute inset-0 flex">{fileNodes}</div>
      <div className="flex flex-col gap-12 items-center">
        <div className="relative p-10">
          <h3 className="font-bold text-xl lg:text-4xl relative">
            {slide.title?.[context.language]}
          </h3>
        </div>
        {buttonsNodes}
      </div>
    </div>
  );

  const wrapperProps = {
    className: cn("w-full flex", entityClassName(slide)),
    "data-model": "elements",
    "data-module": "website-builder",
    "data-variant": "default",
  };

  return slide.url ? (
    <Link href={href} {...wrapperProps}>
      {content}
    </Link>
  ) : (
    <div {...wrapperProps}>{content}</div>
  );
}

async function renderSlider(
  slider: WebsiteBuilderSliderModel,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(slidersToSlidesApi, [
      {
        column: "sliderId",
        method: "eq",
        value: slider.id,
      },
    ])
  ).sort(byOrderIndex);
  const slides = await findByIds(
    websiteBuilderSlideApi,
    relations.map((relation) => relation.slideId),
  );
  const slidesById = new Map(slides.map((slide) => [slide.id, slide]));
  const slideNodes = await Promise.all(
    relations.map(async (relation) => {
      const slide = slidesById.get(relation.slideId);

      if (!slide) {
        return null;
      }

      return (
        <div
          key={relation.id || `${slider.id}-${slide.id}`}
          data-module="website-builder"
          data-relation="sliders-to-slides"
          data-id={relation.id || ""}
          data-variant={relation.variant}
          className={cn("w-full flex", entityClassName(relation))}
        >
          {await renderSlide(slide, context)}
        </div>
      );
    }),
  );

  return renderVariantComponent(
    WebsiteBuilderSliderClientComponent as ComponentType<any>,
    {
      className: entityClassName(slider),
      data: slider,
      isServer: true,
      language: context.language,
      sliderToSlides: slideNodes.filter(Boolean),
      variant: slider.variant,
    },
  );
}

async function renderWidgetSliderRelations(
  widgetId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(widgetsToSlidersApi, [
      {
        column: "widgetId",
        method: "eq",
        value: widgetId,
      },
    ])
  ).sort(byOrderIndex);

  const sliders = await findByIds(
    websiteBuilderSliderApi,
    relations.map((relation) => relation.sliderId),
  );
  const slidersById = new Map(sliders.map((slider) => [slider.id, slider]));

  return Promise.all(
    relations.map(async (relation) => {
      const slider = slidersById.get(relation.sliderId);

      if (!slider) {
        return null;
      }

      return (
        <div
          key={relation.id || `${widgetId}-${slider.id}`}
          data-module="website-builder"
          data-relation="widgets-to-sliders"
          data-id={relation.id || ""}
          data-variant={relation.variant}
          className={cn("w-full flex", entityClassName(relation))}
        >
          {await renderSlider(slider, context)}
        </div>
      );
    }),
  );
}

async function renderFeature(
  feature: WebsiteBuilderFeatureModel,
  context: RouteRenderContext,
) {
  const fileRelations = (
    await findEntities(featuresToFileStorageModuleFilesApi, [
      {
        column: "featureId",
        method: "eq",
        value: feature.id,
      },
    ])
  ).sort(byOrderIndex);

  const fileNodes = await Promise.all(
    fileRelations.map((relation) =>
      renderFileRelation(
        "features-to-file-storage-module-files",
        relation,
        context,
      ),
    ),
  );

  return (
    <div
      data-module="website-builder"
      data-model="feature"
      data-id={feature.id || ""}
      data-variant={feature.variant}
      className={cn("flex flex-col w-full", entityClassName(feature))}
    >
      {feature.title?.[context.language] ? (
        <p className="text-3xl font-medium leading-6 text-gray-900">
          {feature.title[context.language]}
        </p>
      ) : null}
      {feature.description?.[context.language] &&
      feature.description[context.language] !== TIPTAP_EMPTY_DOC ? (
        <TipTap value={feature.description[context.language] || ""} />
      ) : null}
      {fileNodes}
    </div>
  );
}

async function renderWidgetFeatureRelations(
  widgetId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(widgetsToFeaturesApi, [
      {
        column: "widgetId",
        method: "eq",
        value: widgetId,
      },
    ])
  ).sort(byOrderIndex);

  const features = await findByIds(
    websiteBuilderFeatureApi,
    relations.map((relation) => relation.featureId),
  );
  const featuresById = new Map(
    features.map((feature) => [feature.id, feature]),
  );

  return Promise.all(
    relations.map(async (relation) => {
      const feature = featuresById.get(relation.featureId);

      if (!feature) {
        return null;
      }

      return (
        <div
          key={relation.id || `${widgetId}-${feature.id}`}
          data-module="website-builder"
          data-relation="widgets-to-features"
          data-id={relation.id || ""}
          data-variant={relation.variant}
          className={cn("w-full flex", entityClassName(relation))}
        >
          {await renderFeature(feature, context)}
        </div>
      );
    }),
  );
}

async function renderWidgetFileRelations(
  widgetId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(widgetsToFileStorageModuleFilesApi, [
      {
        column: "widgetId",
        method: "eq",
        value: widgetId,
      },
    ])
  ).sort(byOrderIndex);

  return Promise.all(
    relations.map((relation) =>
      renderFileRelation(
        "widgets-to-file-storage-module-files",
        relation,
        context,
      ),
    ),
  );
}

export async function renderWebsiteBuilderWidget(
  widget: WebsiteBuilderWidgetModel,
  context: RouteRenderContext,
  options?: {
    children?: ReactNode;
  },
) {
  const children = options?.children || null;

  switch (widget.variant) {
    case "content-default": {
      const [buttons, files, sliders, features] = await Promise.all([
        renderWidgetButtonsArrayRelations({
          context,
          widgetId: widget.id,
        }),
        renderWidgetFileRelations(widget.id, context),
        renderWidgetSliderRelations(widget.id, context),
        renderWidgetFeatureRelations(widget.id, context),
      ]);

      return (
        <div
          data-module="website-builder"
          data-model="widget"
          data-id={widget.id || ""}
          data-variant={widget.variant}
          className={cn(
            "w-full flex flex-col",
            entityClassName(widget) || "px-2 py-20 lg:py-32",
          )}
        >
          <div className="w-full flex items-start flex-col gap-5 mx-auto max-w-7xl">
            {renderVariantComponent(
              WebsiteBuilderContentClientComponent as ComponentType<any>,
              {},
            )}
            {widget.subtitle?.[context.language] ? (
              <h3 className="text-base tracking-tight text-gray-600 sm:text-md md:text-xl max-w-xl">
                {widget.subtitle[context.language]}
              </h3>
            ) : null}
            {widget.title?.[context.language] ? (
              <h1 className="text-4xl font-bold tracking-tight xl:inline text-gray-900 sm:text-5xl md:text-6xl max-w-3xl">
                {widget.title[context.language]}
              </h1>
            ) : null}
            {widget.description?.[context.language] ? (
              <TipTap value={widget.description[context.language] ?? ""} />
            ) : null}
            <div className="mx-auto my-5 max-w-md flex flex-col sm:flex-row justify-center md:mt-8 gap-4">
              {buttons}
            </div>
            {children}
            <div className="w-full">{files}</div>
            <div className="w-full flex">{sliders}</div>
            <div className="w-full flex">{features}</div>
          </div>
        </div>
      );
    }
    case "footer-default": {
      const [logotypes, additionalButtons, defaultButtons, extraButtons] =
        await Promise.all([
          renderWidgetLogotypeRelations(widget.id, context),
          renderWidgetButtonsArrayRelations({
            context,
            variant: "additional",
            widgetId: widget.id,
          }),
          renderWidgetButtonsArrayRelations({
            context,
            variant: "default",
            widgetId: widget.id,
          }),
          renderWidgetButtonsArrayRelations({
            context,
            variant: "extra",
            widgetId: widget.id,
          }),
        ]);

      return (
        <div
          data-module="website-builder"
          data-model="widget"
          data-id={widget.id || ""}
          data-variant={widget.variant}
          className={cn(
            "w-full bg-white flex flex-col",
            entityClassName(widget) ||
              "pb-4 pt-12 px-4 lg:pb-6 lg:pt-16 lg:px-2",
          )}
        >
          <div className="mx-auto w-full max-w-7xl flex flex-col gap-4">
            <div className="w-full flex flex-col lg:grid lg:grid-cols-4 justify-end gap-12">
              <div className="w-fit flex flex-col gap-2">
                {logotypes}
                {additionalButtons}
              </div>
              <div className="flex flex-col col-span-2 col-start-3 lg:grid lg:grid-cols-3 gap-6">
                {defaultButtons}
              </div>
            </div>
            {children}
            <div className="w-full h-px bg-gray-400"></div>
            <div className="flex flex-col items-start lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-4">
                {extraButtons}
              </div>
            </div>
          </div>
        </div>
      );
    }
    case "navbar-default": {
      const [logotypes, defaultButtons, additionalButtons] = await Promise.all([
        renderWidgetLogotypeRelations(widget.id, context),
        renderWidgetButtonsArrayRelations({
          context,
          variant: "default",
          widgetId: widget.id,
        }),
        renderWidgetButtonsArrayRelations({
          context,
          variant: "additional",
          widgetId: widget.id,
        }),
      ]);

      return renderVariantComponent(
        WebsiteBuilderNavbarDefaultComponent as ComponentType<any>,
        {
          content: (
            <div className="flex flex-col lg:flex-row w-full px-2 lg:px-0 items-center justify-between gap-2">
              <div className="flex flex-row gap-2">{defaultButtons}</div>
              <div className="flex flex-row gap-2">{additionalButtons}</div>
            </div>
          ),
          data: widget,
          isServer: true,
          language: context.language,
          logotype: <div className="w-fit">{logotypes}</div>,
          variant: widget.variant,
          children,
        },
      );
    }
    default:
      warnSiteRuntime(
        `Unsupported direct website-builder widget variant "${widget.variant}" for widget "${widget.id}".`,
      );
      return null;
  }
}

export async function renderWebsiteBuilderWidgetById(
  widgetId: string,
  context: RouteRenderContext,
  options?: {
    children?: ReactNode;
  },
) {
  const widget = await findById(websiteBuilderWidgetApi, widgetId);

  if (!widget?.id) {
    return null;
  }

  return renderWebsiteBuilderWidget(widget, context, options);
}
