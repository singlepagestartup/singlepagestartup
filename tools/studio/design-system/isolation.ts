import path from "node:path";

/** Exact UI-only public entries shared by Studio and production. No package barrels. */
const pureEntries = new Map([
  ["@sps/shared-utils/metadata", "libs/shared/utils/src/lib/metadata/index.ts"],
  [
    "@sps/shared-frontend-client-utils/chat-scroll",
    "libs/shared/frontend/client/utils/src/lib/chat-scroll/index.ts",
  ],
  [
    "@sps/shared-utils/chat-scroll",
    "libs/shared/utils/src/lib/constants/chat-scroll.ts",
  ],
  ["@sps/ui-adapter/toast", "libs/shared/ui/adapter/src/lib/toast/index.tsx"],
  [
    "@sps/ui-adapter/openai-work-model-picker",
    "libs/shared/ui/adapter/src/lib/model-picker/OpenAIWorkModelPicker.tsx",
  ],
  [
    "@sps/shared-utils/provider-models",
    "libs/shared/utils/src/lib/provider-models/index.ts",
  ],
  [
    "@sps/shared-frontend-client-utils/cn",
    "libs/shared/frontend/client/utils/src/lib/cn/index.ts",
  ],
  [
    "@sps/shared-ui-shadcn/form/styles",
    "libs/shared/ui/shadcn/src/lib/form/styles.ts",
  ],
  ...["button", "dropdown-menu", "input", "popover"].map(
    (control) =>
      [
        `@sps/shared-ui-shadcn/${control}`,
        `libs/shared/ui/shadcn/src/lib/${control}/index.tsx`,
      ] as const,
  ),
]);

export function pureStudioAliases(root: string): Record<string, string> {
  return Object.fromEntries(
    [...pureEntries].map(([name, file]) => [name, path.join(root, file)]),
  );
}

export function pureStudioUtility(
  root: string,
  specifier: string,
): string | undefined {
  const file = pureEntries.get(specifier);
  return file ? path.join(root, file) : undefined;
}

export function isPureStudioUtilityFile(root: string, file: string): boolean {
  if (
    [...pureEntries.values()].some((entry) => path.join(root, entry) === file)
  )
    return true;
  return (
    file ===
      path.join(
        root,
        "libs/shared/utils/src/lib/constants/provider-models.ts",
      ) ||
    [
      "libs/shared/utils/src/lib/metadata",
      "libs/shared/ui/adapter/src/lib/toast",
      "libs/shared/ui/adapter/src/lib/icons",
      "libs/shared/ui/adapter/src/lib/model-picker",
    ].some((entry) => file.startsWith(path.join(root, entry) + path.sep))
  );
}

export function isPureStudioExternal(specifier: string): boolean {
  return [
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-slot",
    "class-variance-authority",
    "clsx",
    "lucide-react",
    "react",
    "sonner",
    "tailwind-merge",
    "zod",
  ].includes(specifier);
}

export function pureStudioUtilities(root: string): string[] {
  return [...pureEntries.values()].map((entry) => path.join(root, entry));
}
