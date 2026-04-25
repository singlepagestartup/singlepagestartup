import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { Component as Admin } from "../../../host/src/components/admin";
import { Component as AdminV2 } from "../../../host/src/components/admin-v2";
import { MetadataHead } from "./MetadataHead";
import { NotFoundPage } from "./NotFoundPage";
import type { TWakuPath } from "../lib/routing";

type TProps = {
  language: string;
  slashedUrl: TWakuPath;
};

export async function PrefixedHostPage(props: TProps) {
  if (props.slashedUrl.startsWith("/admin")) {
    return (
      <>
        <MetadataHead url={props.slashedUrl} />
        <AdminV2
          isServer={true}
          url={props.slashedUrl}
          language={props.language}
        />
      </>
    );
  }

  return (
    <>
      <MetadataHead url={props.slashedUrl} />
      <HostModulePage
        isServer={true}
        variant="find-by-url"
        url={props.slashedUrl}
      >
        {({ data }) => {
          if (!data) {
            return <NotFoundPage language={props.language} />;
          }

          return (
            <>
              <Admin isServer={true} />
              <HostModulePage
                isServer={true}
                variant={data?.variant as any}
                data={data}
                url={props.slashedUrl}
                language={props.language}
              />
            </>
          );
        }}
      </HostModulePage>
    </>
  );
}
