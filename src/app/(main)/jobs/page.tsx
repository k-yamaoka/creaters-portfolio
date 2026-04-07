import { createClient } from "@/lib/supabase/server";
import { JobsPageClient } from "./jobs-client";

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      `
      *,
      client:client_profiles!jobs_client_id_fkey (
        id,
        company_name,
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return <JobsPageClient jobs={jobs ?? []} />;
}
