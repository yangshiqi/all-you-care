// src/components/AuthorAvatar.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AuthorAvatarProps {
  author: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  showName?: boolean;
}

const AUTHOR_MAP: Record<string, string> = {
  'zack': '/images/avatars/zack.png',
  'tom': '/images/avatars/tom.png',
  'brad': '/images/avatars/brad.png',
  'tim': '/images/avatars/tim.png',
};

const AUTHOR_ROLES: Record<string, string> = {
  'zack': 'Editor-in-Chief / The Cynic',
  'tom': 'Technical Editor / The Engineer',
  'brad': 'Visionary Editor / The Accelerator',
  'tim': 'Safety Editor / The Skeptic',
};

export function AuthorAvatar({ author, size = 'md', className, showName = false }: AuthorAvatarProps) {
  // Safe handling for potentially missing author
  const safeAuthor = author || 'SnapAI';
  const normalizedAuthor = safeAuthor.toLowerCase().split(' ')[0]; // Handle "Zack" or "Zack @ SnapAllx"
  const imagePath = AUTHOR_MAP[normalizedAuthor];
  const role = AUTHOR_ROLES[normalizedAuthor] || 'SnapAI Editor';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    xxl: 'w-24 h-24',
  };

  if (!imagePath) {
    // Fallback for unknown authors
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-500", sizeClasses[size])}>
          {safeAuthor.charAt(0).toUpperCase()}
        </div>
        {showName && (
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-none">{safeAuthor}</span>
            <span className="text-xs text-muted-foreground">{role}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative rounded-full overflow-hidden border border-border shadow-sm", sizeClasses[size])}>
        <Image
          src={imagePath}
          alt={safeAuthor}
          fill
          className="object-cover"
        />
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-tight font-serif">{safeAuthor}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{role}</span>
        </div>
      )}
    </div>
  );
}
