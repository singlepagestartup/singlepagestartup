import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { internationalization } from "@sps/shared-configuration";

export default async function NotFoundPage() {
  return (
    <HostModulePage isServer={true} variant="find-by-url" url="/404">
      {({ data }) => {
        if (!data) {
          return (
            <div className="w-screen h-screen flex items-center justify-center">
              <p className="font-bold text-4xl">Not found</p>
            </div>
          );
        }

        return (
          <HostModulePage
            isServer={true}
            variant={data?.variant as any}
            data={data}
            url="/404"
            language={internationalization.defaultLanguage.code}
          />
        );
      }}
    </HostModulePage>
  );
}
