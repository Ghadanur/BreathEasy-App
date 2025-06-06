
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-24 w-24',
  };

  return (
    <div 
      className={cn("flex flex-col items-center justify-center gap-4", className)}
      role={text ? "status" : undefined} // Add role="status" if text is present for screen reader announcement
    >
      <Loader2 aria-hidden="true" className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
}
