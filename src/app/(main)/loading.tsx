export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-pulse">
      <div className="h-10 bg-muted/60 rounded-xl w-3/4" />
      <div className="h-36 bg-muted/40 rounded-2xl" />
      <div className="h-24 bg-muted/40 rounded-xl" />
      <div className="h-16 bg-muted/40 rounded-xl w-2/3" />
    </div>
  );
}
