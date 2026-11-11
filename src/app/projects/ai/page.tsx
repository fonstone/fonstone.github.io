import type { Metadata } from "next";
import CourseHubPage from "@/components/course/CourseHubPage";
import { hubSeo } from "@/lib/constants/courses";

export const metadata: Metadata = hubSeo("ai");

export default function AiHubPage() {
  return <CourseHubPage slug="ai" />;
}
