import { Component as ArticleOverviewContent } from "../default/Content";
import type { IContentProps } from "./interface";

export function Component(props: IContentProps) {
  return (
    <ArticleOverviewContent
      isServer={props.isServer}
      language={props.language}
      articleSlug={props.articleSlug}
      articleVariant="overview-with-private-content-default"
      renderAuthor={props.renderAuthor}
      renderAuthorCard={props.renderAuthorCard}
      renderCommentsContent={props.renderCommentsContent}
      renderNavigation={props.renderNavigation}
      renderContent={props.renderContent ?? props.renderPrivateContent}
    />
  );
}
