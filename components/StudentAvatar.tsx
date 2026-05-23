import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StudentAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { wrapper: 'w-8 h-8 text-xs', image: 32 },
  md: { wrapper: 'w-10 h-10 text-sm', image: 40 },
  lg: { wrapper: 'w-14 h-14 text-base', image: 56 },
};

export function StudentAvatar({ name, photoUrl, size = 'md', className }: StudentAvatarProps) {
  const { wrapper, image } = sizeMap[size];

  if (photoUrl) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', wrapper, className)}>
        <Image src={photoUrl} alt={name} width={image} height={image} className="object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center flex-shrink-0',
        wrapper,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
