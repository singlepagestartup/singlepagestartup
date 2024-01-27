import { BACKEND_URL, getBackendData } from "@sps/utils";
import { populate as pagePopulate } from "@sps/sps-website-builder-frontend/lib/redux/entities/page/populate";
import type { IEntity as IBackendPage } from "@sps/sps-website-builder-frontend/lib/redux/entities/page/interfaces";
import { PageBlocks } from "@sps/sps-website-builder-frontend";

export default async function NotFoundPage() {
  const pages = (await getBackendData({
    url: `${BACKEND_URL}/api/sps-website-builder/pages`,
    params: {
      populate: pagePopulate,
      filters: {
        url: "/404",
      },
    },
  })) as IBackendPage[];

  if (!pages?.length) {
    return <div>Not found</div>;
  }

  return <PageBlocks page={pages[0]} pageBlocks={pages[0].pageBlocks} />;
}