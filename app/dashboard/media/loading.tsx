export default function MediaLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
