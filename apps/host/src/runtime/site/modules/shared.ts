type FilterValue = string | number | boolean | string[] | number[] | null;

type AndFilter = {
  column: string;
  method: string;
  value: FilterValue;
};

interface FindApi<T> {
  find(props: {
    params: {
      filters: {
        and: AndFilter[];
      };
    };
    catchErrors?: boolean;
  }): Promise<T[] | undefined>;
}

interface FindByIdApi<T> {
  findById(props: { id: string }): Promise<T | undefined>;
}

export function byOrderIndex(
  left?: { orderIndex?: number | null },
  right?: { orderIndex?: number | null },
) {
  return (left?.orderIndex || 0) - (right?.orderIndex || 0);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export async function findEntities<T>(
  api: FindApi<T>,
  filters: AndFilter[],
): Promise<T[]> {
  return (
    (await api
      .find({
        params: {
          filters: {
            and: filters,
          },
        },
        catchErrors: true,
      })
      .catch(() => undefined)) || []
  );
}

export async function findById<T>(
  api: FindByIdApi<T>,
  id?: string | null,
): Promise<T | undefined> {
  if (!id) {
    return undefined;
  }

  return api
    .findById({
      id,
    })
    .catch(() => undefined);
}

export async function findByIds<T extends { id: string }>(
  api: FindByIdApi<T>,
  ids: string[],
): Promise<T[]> {
  const entities = await Promise.all(
    unique(ids).map((id) => findById(api, id)),
  );

  return entities.filter((entity) => Boolean(entity?.id)) as T[];
}
