import {
  HostWidgetsToExternalWidgets,
  defaultHostExternalArticleLink,
  type HostExternalWidgetLink,
  type HostWidgetsToExternalWidgetsProps,
} from "../../../../relations/widgets-to-external-widgets/singlepage/default/Component";

export interface HostWidgetDefaultProps {
  id: string;
  links: HostExternalWidgetLink[];
  articleProps?: HostWidgetsToExternalWidgetsProps["articleProps"];
  productProps?: HostWidgetsToExternalWidgetsProps["productProps"];
}

export const defaultHostWidgetProps: HostWidgetDefaultProps = {
  id: defaultHostExternalArticleLink.widgetId,
  links: [defaultHostExternalArticleLink],
};

export function HostWidgetDefault(props: Partial<HostWidgetDefaultProps> = {}) {
  const { id, links, articleProps, productProps } = {
    ...defaultHostWidgetProps,
    ...props,
  };
  const scopedLinks = links
    .filter((link) => link.widgetId === id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div
      data-ds-block="host.widget.default"
      data-ds-imports="host.widgets-to-external-widgets.default"
      data-ds-layer="singlepage"
      data-widget-id={id}
    >
      {scopedLinks.map((link) => (
        <HostWidgetsToExternalWidgets
          key={link.id}
          link={link}
          articleProps={articleProps}
          productProps={productProps}
        />
      ))}
    </div>
  );
}
