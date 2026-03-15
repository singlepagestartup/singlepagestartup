export function Component(props: any) {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 border border-gray-100 border-dashed">
      <div className="flex flex-col items-center py-16">
        <h2 className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl w-fit">
          {props.error?.message || "Oh no! Something went wrong..."}
        </h2>
      </div>
    </div>
  );
}
