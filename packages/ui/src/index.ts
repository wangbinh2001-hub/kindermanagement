// Phase 1.5 UI foundation: design tokens + state primitives + layout primitives

export { cn } from './lib/utils';

export const designTokens = {
  color: {
    bg: 'bg-background',
    fg: 'text-foreground',
    muted: 'text-muted-foreground',
    border: 'border-border',
    primary: 'bg-primary text-primary-foreground',
  },
  spacing: {
    card: 'p-4 md:p-6',
    section: 'py-6 md:py-10',
  },
} as const;

export type UiState = 'loading' | 'empty' | 'error' | 'success';

export const uiStateLabel = (state: UiState): string => {
  switch (state) {
    case 'loading': return 'Đang tải';
    case 'empty': return 'Chưa có dữ liệu';
    case 'error': return 'Đã xảy ra lỗi';
    case 'success': return 'Thành công';
  }
};

export * from './components/Button';
export * from './components/Input';
export * from './components/Skeleton';
export * from './components/EmptyState';
export * from './components/ErrorState';
