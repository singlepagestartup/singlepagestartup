"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useLocalStorage(key: string) {
  /**
   * Debounce makes the first render with undefined, but subject.init component issues
   * the new subject. To prevent that initially we set the value to empty string and check
   * value by
   *
   * ```typescript
   * if (!refreshToken && typeof refreshToken !== "string") {
   *  init.refetch();
   * }
   * ```
   *
   * Without that every refresh of the page will trigger the refetch subject creation.
   */
  const [storedValue, setStoredValue] = useState<string | undefined>("");

  const handleStorageChange = useDebouncedCallback(() => {
    const newValue = localStorage.getItem(key);

    if (storedValue === newValue) {
      return;
    }

    setStoredValue((prevValue) => {
      if (!newValue) {
        return undefined;
      }

      if (newValue === prevValue) {
        return prevValue;
      }

      return newValue;
    });
  }, 100);

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return storedValue;
}
