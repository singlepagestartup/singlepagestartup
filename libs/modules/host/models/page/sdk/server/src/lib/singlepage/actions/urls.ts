import { route, serverHost } from "@sps/host/models/page/sdk/model";
import { responsePipe, type NextRequestOptions } from "@sps/shared-utils";

interface IUrlRecord {
  url: string;
}

interface IUrlsProps {
  catchErrors?: boolean;
  host?: string;
}

export async function action({
  host = serverHost,
  catchErrors = false,
}: IUrlsProps) {
  try {
    const options: Partial<NextRequestOptions> = { cache: "no-store" };
    const res = await fetch(`${host}${route}/urls`, options);
    const json = await responsePipe<{ data: { urls: IUrlRecord[] } }>({ res });
    if (!Array.isArray(json?.data?.urls)) {
      throw new Error("Invalid page URL enumeration response");
    }
    return json.data.urls.map((entry) => {
      if (typeof entry.url !== "string" || !entry.url.startsWith("/")) {
        throw new Error("Invalid URL in page enumeration response");
      }
      return { url: entry.url.split("/").filter(Boolean) };
    });
  } catch (error) {
    if (catchErrors) return undefined;
    throw error;
  }
}
