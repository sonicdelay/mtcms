import { redirect } from "next/navigation";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

export default function EditIndexPage() {
  redirect(`/admin/edit/${ZERO_UUID}`);
}
