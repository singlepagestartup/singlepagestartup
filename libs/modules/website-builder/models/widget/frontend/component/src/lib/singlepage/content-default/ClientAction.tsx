"use client";

import { IComponentPropsExtended } from "./interface";
import { useState } from "react";

export function Component() {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => {
        setCount(count + 1);
      }}
    >
      Count is: {count}
    </button>
  );
}
