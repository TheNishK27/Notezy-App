import { supabase } from "@/lib/supabase";

export const getRecentNotes = async () => {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

export const getTrendingNotes = async () => {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("downloads", { ascending: false });

  if (error) throw error;

  return data;
};

export const getNote = async (id) => {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
};