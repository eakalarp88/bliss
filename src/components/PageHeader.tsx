'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  rightContent,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-beige-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </div>
  );
}
