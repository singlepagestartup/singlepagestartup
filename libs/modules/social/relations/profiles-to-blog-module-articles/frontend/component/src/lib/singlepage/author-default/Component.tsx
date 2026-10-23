import type { IComponentPropsExtended } from "./interface";
import {
  Component as Profile,
  BylineSkeleton,
} from "@sps/social/models/profile/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-relation="profiles-to-blog-module-articles"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("min-w-0", props.data.className, props.className)}
    >
      <Profile
        isServer={props.isServer}
        variant="find"
        skeleton={<BylineSkeleton size={props.size} inverse={props.inverse} />}
        apiProps={{
          params: {
            filters: {
              and: [
                { column: "id", method: "eq", value: props.data.profileId },
              ],
            },
          },
        }}
      >
        {({ data }) =>
          data?.map((profile) => (
            <Profile
              key={profile.id}
              isServer={props.isServer}
              variant="byline"
              dataSource="props"
              data={profile}
              language={props.language}
              size={props.size}
              inverse={props.inverse}
            />
          ))
        }
      </Profile>
    </div>
  );
}
