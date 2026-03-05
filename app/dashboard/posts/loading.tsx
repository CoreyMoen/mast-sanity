export default function PostsLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
