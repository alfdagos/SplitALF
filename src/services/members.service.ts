import { supabase } from '@/lib/supabase';
import type { MemberWithProfile, Profile } from '@/types';

export const membersService = {
  /** Membri del gruppo con i dati del profilo, ordinati per data di ingresso. */
  async listMembers(groupId: string): Promise<MemberWithProfile[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select(
        'user_id, joined_at, profile:profiles!group_members_user_id_fkey(id, email, name, created_at)',
      )
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      user_id: row.user_id,
      joined_at: row.joined_at,
      profile: row.profile as unknown as Profile,
    }));
  },

  /** Aggiunge un membro tramite email usando la RPC SECURITY DEFINER. */
  async addByEmail(groupId: string, email: string): Promise<Profile> {
    const { data, error } = await supabase.rpc('add_member_by_email', {
      _group_id: groupId,
      _email: email,
    });
    if (error) throw error;
    return data as Profile;
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
