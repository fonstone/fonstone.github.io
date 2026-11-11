import type { Metadata } from "next";
import CourseHubPage from "@/components/course/CourseHubPage";
import { hubSeo } from "@/lib/constants/courses";

export const metadata: Metadata = hubSeo("qemu-cpu");

export default function QemuCpuHubPage() {
  return <CourseHubPage slug="qemu-cpu" />;
}
