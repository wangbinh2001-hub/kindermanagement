import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Đã có lỗi xảy ra",
  description = "Không thể tải dữ liệu vào lúc này. Vui lòng thử lại sau.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-destructive/20 rounded-xl bg-destructive/5">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-destructive">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 border-destructive/30 hover:bg-destructive/10 text-destructive">
          Thử lại
        </Button>
      )}
    </div>
  );
}
