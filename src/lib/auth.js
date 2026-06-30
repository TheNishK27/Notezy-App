import { supabase } from "./supabase";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function logout() {
  await supabase.auth.signOut();
}