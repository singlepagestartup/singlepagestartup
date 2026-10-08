import { Component as View } from "./index";
import { useCallback, useState } from "react";
export function Component() {
  const [selected, setSelected] = useState(false);
  const toggleSelected = useCallback(
    () => setSelected((current) => !current),
    [],
  );
  return (
    <div className="max-w-sm rounded-2xl bg-sps-graphite p-4 text-white">
      <View
        id="brief"
        name="Brief.md"
        selected={selected}
        onSelect={toggleSelected}
      />
    </div>
  );
}
