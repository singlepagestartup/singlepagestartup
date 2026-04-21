import { ComponentType, ReactNode, createElement } from "react";

import { api as crmFormApi } from "@sps/crm/models/form/sdk/server";
import type { IModel as CrmWidgetModel } from "@sps/crm/models/widget/sdk/model";
import { api as crmWidgetsToFormsApi } from "@sps/crm/relations/widgets-to-forms/sdk/server";
import { api as crmWidgetsToWebsiteBuilderModuleWidgetsApi } from "@sps/crm/relations/widgets-to-website-builder-module-widgets/sdk/server";

import { Component as CrmFormDefaultComponent } from "@sps/crm/models/form/frontend/component/src/lib/singlepage/default/Component";
import { Component as CrmWidgetFormListDefaultComponent } from "@sps/crm/models/widget/frontend/component/src/lib/singlepage/form/list/default/Component";
import { Component as HostRbacMeCrmFormRequestCreateComponent } from "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/crm-module-form-request-create/Component";

import { RouteRenderContext } from "../types";
import { warnSiteRuntime } from "../warnings";
import { byOrderIndex, findByIds, findEntities } from "./shared";
import { renderWebsiteBuilderWidgetById } from "./website-builder";

async function renderForms(
  widgetId: string,
  context: RouteRenderContext,
): Promise<ReactNode[]> {
  const relations = (
    await findEntities(crmWidgetsToFormsApi, [
      {
        column: "widgetId",
        method: "eq",
        value: widgetId,
      },
    ])
  ).sort(byOrderIndex);
  const forms = await findByIds(
    crmFormApi,
    relations.map((relation) => relation.formId),
  );
  const formsById = new Map(forms.map((form) => [form.id, form]));

  return relations
    .map((relation) => {
      const form = formsById.get(relation.formId);

      if (!form) {
        return null;
      }

      return createElement(CrmFormDefaultComponent as ComponentType<any>, {
        children: createElement(
          HostRbacMeCrmFormRequestCreateComponent as ComponentType<any>,
          {
            crmModuleForm: form,
            isServer: true,
            language: context.language,
            variant: "me-crm-module-form-request-create",
          },
        ),
        data: form,
        isServer: true,
        key: relation.id || `${widgetId}-${form.id}`,
        language: context.language,
        variant: form.variant,
      });
    })
    .filter(Boolean) as ReactNode[];
}

export async function renderCrmWidget(
  widget: CrmWidgetModel,
  context: RouteRenderContext,
) {
  switch (widget.variant) {
    case "form-list-default": {
      const forms = await renderForms(widget.id, context);
      const websiteBuilderRelations = (
        await findEntities(crmWidgetsToWebsiteBuilderModuleWidgetsApi, [
          {
            column: "widgetId",
            method: "eq",
            value: widget.id,
          },
        ])
      ).sort(byOrderIndex);

      const content = forms.length ? forms : null;

      if (websiteBuilderRelations.length) {
        const wrappedForms = await Promise.all(
          websiteBuilderRelations.map(async (relation) => {
            const widgetNode = await renderWebsiteBuilderWidgetById(
              relation.websiteBuilderModuleWidgetId,
              context,
              {
                children: content,
              },
            );

            if (!widgetNode) {
              return null;
            }

            return (
              <div
                key={
                  relation.id ||
                  `${widget.id}-${relation.websiteBuilderModuleWidgetId}`
                }
              >
                {widgetNode}
              </div>
            );
          }),
        );

        return createElement(
          CrmWidgetFormListDefaultComponent as ComponentType<any>,
          {
            children: wrappedForms,
            data: widget,
            isServer: true,
            language: context.language,
            variant: widget.variant,
          },
        );
      }

      return createElement(
        CrmWidgetFormListDefaultComponent as ComponentType<any>,
        {
          children: content,
          data: widget,
          isServer: true,
          language: context.language,
          variant: widget.variant,
        },
      );
    }
    default:
      warnSiteRuntime(
        `Unsupported direct crm widget variant "${widget.variant}" for widget "${widget.id}".`,
      );
      return null;
  }
}
