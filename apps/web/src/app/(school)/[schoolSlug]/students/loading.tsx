import vi from '@/locales/vi.json';

export default function StudentsLoading() {
  return (
    <div aria-busy="true" aria-label={vi.students.loading} className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-md animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 border-b border-border p-4 last:border-0">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
