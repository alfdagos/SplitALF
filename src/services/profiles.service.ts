import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export const profilesService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateName(userId: string, name: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
