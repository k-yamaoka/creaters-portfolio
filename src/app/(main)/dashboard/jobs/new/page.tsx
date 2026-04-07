import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { JobForm } from "./job-form";

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "creator") redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">新規案件を作成</h1>
      <p className="mt-2 text-sm text-[#828282]">
        募集要項を入力して、クリエイターからの応募を受け付けましょう
      </p>
      <div className="mt-6">
        <JobForm />
      </div>
    </div>
  );
}
