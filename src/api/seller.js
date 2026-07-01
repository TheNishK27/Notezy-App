import { supabase } from "@/lib/supabase";

export const getMyNotes = async () => {
  const { data: auth } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("seller_id", auth.user.id);

  if (error) throw error;

  return data;
};