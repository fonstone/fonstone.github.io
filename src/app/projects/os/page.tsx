import type { Metadata } from "next";
import CourseHubPage from "@/components/course/CourseHubPage";
import { hubSeo } from "@/lib/constants/courses";

export const metadata: Metadata = hubSeo("os");

export default function OsHubPage() {
  return <CourseHubPage slug="os" />;
}
