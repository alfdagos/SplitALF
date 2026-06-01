import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  className?: string;
}

/** Avatar con iniziali derivate dal nome dell'utente. */
export function UserAvatar({ name, className }: UserAvatarProps) {
  return (
    <Avatar className={cn('h-9 w-9', className)}>
      <AvatarFallback className="bg-primary/10 text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
