"use client";

import { ClientCompositionProvider } from "@sps/blog/frontend/component/provider";
import { Component as AuthorLinks } from "@sps/social/relations/profiles-to-blog-module-articles/frontend/component";
import { BylineSkeleton } from "@sps/social/models/profile/frontend/component";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  return (
    <ClientCompositionProvider
      renderAuthor={({ data, size, inverse }) => (
        <AuthorLinks
          isServer={false}
          variant="find"
          skeleton={<BylineSkeleton size={size} inverse={inverse} />}
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "blogModuleArticleId",
                    method: "eq",
                    value: data.id,
                  },
                ],
              },
              orderBy: {
                and: [
                  { column: "orderIndex", method: "asc" },
                  { column: "id", method: "asc" },
                ],
              },
            },
          }}
        >
          {({ data: links }) =>
            links?.map((link) => (
              <AuthorLinks
                key={link.id}
                isServer={false}
                variant="author-default"
                dataSource="props"
                data={link}
                language={props.language}
                size={size}
                inverse={inverse}
              />
            ))
          }
        </AuthorLinks>
      )}
    >
      {props.children}
    </ClientCompositionProvider>
  );
}
