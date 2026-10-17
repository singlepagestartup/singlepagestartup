import path from "node:path";

/** Exact UI-only public entries shared by Studio and production. No package barrels. */
const pureEntries = new Map([
  [
    "@sps/shared-frontend-client-utils/chat-scroll",
    "libs/shared/frontend/client/utils/src/lib/chat-scroll/index.ts",
  ],
  [
    "@sps/shared-utils/chat-scroll",
    "libs/shared/utils/src/lib/constants/chat-scroll.ts",
  ],
  ["@sps/ui-adapter/toast", "libs/shared/ui/adapter/src/lib/toast/index.tsx"],
]);

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
  return [
    "libs/shared/ui/adapter/src/lib/toast",
    "libs/shared/ui/adapter/src/lib/icons",
  ].some((entry) => file.startsWith(path.join(root, entry) + path.sep));
}

export function isPureStudioExternal(specifier: string): boolean {
  return ["react", "sonner", "tailwind-merge"].includes(specifier);
}

export function pureStudioUtilities(root: string): string[] {
  return [...pureEntries.values()].map((entry) => path.join(root, entry));
}
