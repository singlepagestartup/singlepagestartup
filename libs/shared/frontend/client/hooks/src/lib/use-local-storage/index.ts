"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useLocalStorage(key: string) {
  const [storedValue, setStoredValue] = useState<string | undefined>();

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
