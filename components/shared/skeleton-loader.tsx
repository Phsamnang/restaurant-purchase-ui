export function SkeletonLoader() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
      <div className="space-y-2 mt-4">
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
