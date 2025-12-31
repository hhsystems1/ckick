"use client";
import { useRouter } from "next/navigation";

export function useNavigateToEditor() {
  const router = useRouter();
  return (projectName: string) => {
    // You can customize the route as needed
    router.push(`/editor/${encodeURIComponent(projectName)}`);
  };
}
