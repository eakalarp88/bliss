'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const variants = {
      primary: 'bg-primary text-white hover:bg-pink-400 focus:ring-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-beige-200 focus:ring-secondary',
      outline: 'border-2 border-primary text-primary hover:bg-pink-50 focus:ring-primary',
      ghost: 'text-foreground hover:bg-beige-100 focus:ring-beige-200',
      danger: 'bg-destructive text-white hover:bg-red-600 focus:ring-destructive',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[40px]',
      md: 'px-4 py-3 text-base min-h-[48px]',
      lg: 'px-6 py-4 text-lg min-h-[56px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
