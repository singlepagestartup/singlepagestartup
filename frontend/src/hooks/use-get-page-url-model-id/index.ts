import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IBackendApiPage } from "~redux/services/backend/api/page/interfaces";
import { getFiltersFromPageUrl, getTargetPage } from "~utils/api";
const R = require("ramda");

export default function useGetPageUrlModelId({
  modelName,
}: {
  modelName: string;
}) {
  const params = useParams(); //?
  const [page, setPage] = useState<IBackendApiPage>(); //?

  useEffect(() => {
    if (params) {
      getTargetPage(params).then((res) => {
        setPage(res);
      });
    }
  }, [JSON.stringify(params)]);

  const filters = useMemo(() => {
    if (!page) {
      return;
    }

    const pageUrlFilters = getFiltersFromPageUrl({ page, params });
    const targetFilter = pageUrlFilters.find(
      (filter) => filter[modelName] !== undefined,
    );

    if (R.path([modelName, "id", "$in", 0], targetFilter)) {
      return targetFilter[modelName].id["$in"][0];
    }

    return;
  }, [page, params, modelName]);

  return filters;
}
