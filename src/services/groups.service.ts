import { supabase } from '@/lib/supabase';
import type { Group, GroupWithMeta } from '@/types';

export const groupsService = {
  /** Gruppi di cui l'utente è membro, con il conteggio dei membri. */
  async listGroups(): Promise<GroupWithMeta[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => {
      const { group_members, ...group } = row as unknown as Group & {
        group_members: { count: number }[];
      };
      return { ...group, memberCount: group_members?.[0]?.count ?? 0 };
    });
  },

  async getGroup(groupId: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    if (error) throw error;
    return data;
  },

  /** Crea il gruppo e iscrive automaticamente il creatore come membro. */
  async createGroup(name: string, userId: string): Promise<Group> {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, created_by: userId })
      .select()
      .single();
    if (error) throw error;

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId });
    if (memberError) throw memberError;

    return group;
  },

  async renameGroup(groupId: string, name: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update({ name })
      .eq('id', groupId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) throw error;
  },
};
