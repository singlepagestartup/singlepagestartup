export function Component() {
  return (
    <div className="relative rounded-lg border border-input bg-background">
      <div className="flex items-center px-5 absolute transform -translate-y-1/2 inset-x-0 w-full justify-between">
        <div className="bg-background rounded">
          <p className="w-40 h-6 skeleton"></p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-6">
        <div className="skeleton h-8"></div>
        <div className="skeleton h-8"></div>
        <div className="skeleton h-8"></div>
      </div>
    </div>
  );
}
