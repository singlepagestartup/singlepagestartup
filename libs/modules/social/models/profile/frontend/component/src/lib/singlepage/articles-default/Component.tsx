import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProfilesToBlogModuleArticles } from "@sps/social/relations/profiles-to-blog-module-articles/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-model="profile"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        props.data.className,
        props.className,
      )}
    >
      <ProfilesToBlogModuleArticles
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "profileId", method: "eq", value: props.data.id },
              ],
            },
            orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
          },
        }}
      >
        {({ data }) =>
          data?.map((relation) => (
            <ProfilesToBlogModuleArticles
              key={relation.id}
              isServer={props.isServer}
              variant="default"
              data={relation}
              language={props.language}
            />
          ))
        }
      </ProfilesToBlogModuleArticles>
    </div>
  );
}
