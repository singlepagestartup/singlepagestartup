import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";

export async function NotFoundPage(props: { language: string }) {
  return (
    <HostModulePage isServer={true} variant="find-by-url" url="/404">
      {({ data }) => {
        if (!data) {
          return (
            <div className="flex h-screen w-screen items-center justify-center">
              <p className="text-4xl font-bold">Not found</p>
            </div>
          );
        }

        return (
          <HostModulePage
            isServer={true}
            variant={data?.variant as any}
            data={data}
            url="/404"
            language={props.language}
          />
        );
      }}
    </HostModulePage>
  );
}
