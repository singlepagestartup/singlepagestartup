import { firstPage, type IServerReaderProps } from "./interface";

// Both callbacks belong to the server composer. Only its rendered JSX crosses
// the boundary to the domain's interactive table.
export async function Component<T>({
  readPage,
  renderClient,
}: Pick<IServerReaderProps<T>, "readPage" | "renderClient">) {
  const initialData = await readPage(firstPage);
  return renderClient(initialData);
}
