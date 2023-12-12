import PageBlocks from "~components/page-blocks";
import { getBackendData } from "~utils/api";
import { populate as pagePopulate } from "~redux/services/backend/api/page/populate";
import { BACKEND_URL } from "~utils/envs";
import { IBackendApiEntity as IBackendApiPage } from "~redux/services/backend/api/page/interfaces";

export default async function NotFoundPage() {
  const pages = (await getBackendData({
    url: `${BACKEND_URL}/api/pages`,
    params: {
      populate: pagePopulate,
      filters: {
        url: "/404",
      },
    },
  })) as IBackendApiPage[];

  if (!pages?.length) {
    return <div>Not found</div>;
  }

  return <PageBlocks pageBlocks={pages[0].pageBlocks} />;
}
