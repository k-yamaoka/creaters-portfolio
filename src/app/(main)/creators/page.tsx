import { getCreators } from "@/lib/supabase/queries";
import { CreatorsPageClient } from "./creators-client";

export default async function CreatorsPage() {
  const creators = await getCreators();

  return <CreatorsPageClient creators={creators} />;
}
