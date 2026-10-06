"use client";

import { useRouter } from "next/navigation";
import PoliceDashboard from "@/components/station/PoliceDashboard";

export default function StationPage() {
  const router = useRouter();
  return <PoliceDashboard onLogout={() => router.push("/")} />;
}
