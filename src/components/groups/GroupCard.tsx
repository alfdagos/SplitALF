import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { GroupWithMeta } from '@/types';
import { formatDate } from '@/lib/utils';

export function GroupCard({ group }: { group: GroupWithMeta }) {
  return (
    <Link to={`/groups/${group.id}`} className="group block">
      <Card className="transition-colors hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex items-center justify-between p-5">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{group.name}</h3>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.memberCount}{' '}
                {group.memberCount === 1 ? 'membro' : 'membri'}
              </span>
              <span>· dal {formatDate(group.created_at)}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  );
}
