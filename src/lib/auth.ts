import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  student_id?: string;
  department?: string;
  staff_id?: string;
  cafeteria_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  additionalData?: { student_id?: string; department?: string; staff_id?: string; cafeteria_name?: string }
) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName,
        role,
        ...additionalData,
      },
    },
  });

  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentSession = async (): Promise<{ session: Session | null; user: User | null }> => {
  const { data } = await supabase.auth.getSession();
  return { session: data.session, user: data.session?.user ?? null };
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as Profile | null;
};
