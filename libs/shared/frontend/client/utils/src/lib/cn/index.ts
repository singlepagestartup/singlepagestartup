import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function util(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { util as cn };
