import { useEffect } from "react";
import { useNavigate } from "react-router";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

export default function EditIndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/admin/edit/${ZERO_UUID}`, { replace: true });
  }, [navigate]);

  return null;
}
