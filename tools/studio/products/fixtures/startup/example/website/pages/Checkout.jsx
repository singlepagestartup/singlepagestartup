import { useState } from "react";

export default function Checkout() {
  const [selected, setSelected] = useState(false);
  return (
    <div className="space-y-4 p-8">
      <h1 className="text-2xl font-bold">JSX checkout preview</h1>
      <button
        className="rounded bg-teal-700 px-4 py-2 text-white"
        onClick={() => setSelected(true)}
      >
        Choose plan
      </button>
      {selected ? <p role="status">Plan selected</p> : null}
    </div>
  );
}
