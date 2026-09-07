'use client';

import vi from '@/locales/vi.json';

export default function StudentsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section role="alert" className="rounded-lg border border-border bg-card p-8 text-center">
      <h1 className="text-lg font-semibold">{vi.students.errorTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{vi.students.errorDescription}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        {vi.students.retry}
      </button>
    </section>
  );
}
