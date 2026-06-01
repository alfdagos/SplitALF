/** Chiavi centralizzate per la cache di TanStack Query. */
export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  groups: () => ['groups'] as const,
  group: (groupId: string) => ['group', groupId] as const,
  members: (groupId: string) => ['members', groupId] as const,
  expenses: (groupId: string) => ['expenses', groupId] as const,
  recentExpenses: () => ['expenses', 'recent'] as const,
  userTotals: (userId: string) => ['userTotals', userId] as const,
};
