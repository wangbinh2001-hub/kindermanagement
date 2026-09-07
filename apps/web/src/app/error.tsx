"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@km/ui";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log internal error for observability
    console.error("[RootError Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 selection:bg-primary/20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-sm">
            <AlertTriangle className="h-9 w-9" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Đã xảy ra lỗi
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hệ thống gặp sự cố không mong muốn trong khi tải trang. Vui lòng thử tải lại hoặc quay về Trang chủ.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground/70 pt-1">
              Mã tham chiếu lỗi: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} className="w-full sm:w-auto font-semibold gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Thử lại</span>
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto font-medium gap-2">
              <Home className="h-4 w-4" />
              <span>Về Trang chủ</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
