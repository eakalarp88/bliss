'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };

    const initials = getInitials(name);

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-gradient-to-br from-pink-300 to-pink-400',
          'text-white font-semibold',
          'overflow-hidden',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
