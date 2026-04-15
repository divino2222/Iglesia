import { createClient } from "@/lib/supabase/server";

export type ChurchInfo = {
  id: number;
  church_name: string;
  pastor_name: string | null;
  address: string | null;
  sunday_service_time: string | null;
  prayer_schedule: string | null;
  leadership_schedule: string | null;
  welcome_message: string | null;
  whatsapp_number: string | null;
  online_meeting_url: string | null;
  created_at: string;
};

export async function getChurchInfo() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("church_info")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ChurchInfo;
}