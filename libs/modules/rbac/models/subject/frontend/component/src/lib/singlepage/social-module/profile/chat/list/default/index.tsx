import type { IComponentProps } from "./interface";
import Client from "./client";
import { Provider } from "@sps/rbac/models/subject/sdk/client";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Suspense } from "react";
import { Skeleton } from "./Skeleton";

export function Component(props: IComponentProps) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Skeleton language={props.language} compact={props.compact} />
        }
      >
        <Provider>
          <Client
            isServer={false}
            variant={props.variant}
            language={props.language}
            data={props.data}
            socialModuleProfile={props.socialModuleProfile}
            includeSubjectProfiles={props.includeSubjectProfiles}
            currentSocialModuleChatId={props.currentSocialModuleChatId}
            compact={props.compact}
            className={props.className}
            currentChatActions={props.currentChatActions}
            onSelectCurrentChat={
              props.isServer ? undefined : props.onSelectCurrentChat
            }
          />
        </Provider>
      </Suspense>
    </ErrorBoundary>
  );
}
