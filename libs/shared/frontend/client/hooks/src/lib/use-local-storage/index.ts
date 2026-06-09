"use client";

import { useCallback, useEffect, useState } from "react";

const authenticationStorageEvent = "sps-rbac-auth-storage-change";

export function useLocalStorage(key: string) {
  /**
   * The hook starts from an empty string, then synchronizes with localStorage on mount.
   * That lets auth init distinguish "not read yet" from "missing value" by checking
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

  const handleStorageChange = useCallback(() => {
    const newValue = localStorage.getItem(key) ?? undefined;
    setStoredValue((prevValue) => {
      if (newValue === prevValue) {
        return prevValue;
      }

      return newValue;
    });
  }, [key]);

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(authenticationStorageEvent, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        authenticationStorageEvent,
        handleStorageChange,
      );
    };
  }, [handleStorageChange]);

  useEffect(() => {
    handleStorageChange();
  }, [handleStorageChange]);

  return storedValue;
}
