export default function SkeletonCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl mb-4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
}