import Markdown from "markdown-to-jsx";
import { AI_CHAT_MATERIALS_PROCESSING } from "@sps/shared-utils";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <details
      id={props.id || "how-your-materials-are-processed-and-stored"}
      open={props.open}
      className="my-5 text-xs leading-6 text-muted-foreground"
      data-module="website-builder"
      data-model="widget"
      data-variant={props.variant}
    >
      <summary className="min-h-9 cursor-pointer underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        How your materials are processed and stored
      </summary>
      <div className="mt-3 min-w-0 rounded-2xl border border-border bg-card p-5 text-sm">
        <div className="min-w-0 max-w-none break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6">
          <Markdown options={{ disableParsingRawHTML: true }}>
            {AI_CHAT_MATERIALS_PROCESSING}
          </Markdown>
        </div>
      </div>
    </details>
  );
}
