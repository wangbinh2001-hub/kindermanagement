import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variantStyles = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
      outline: 'border border-border bg-card hover:bg-muted text-foreground shadow-xs',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-muted hover:text-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-12 rounded-2xl px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
