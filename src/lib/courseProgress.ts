/** 课程进度的 localStorage 读写，客户端组件共用，不依赖 React。 */
export const PROGRESS_EVENT = "course-progress-change";

export function getStorageKey(projectSlug: string) {
  return `course-progress-${projectSlug}`;
}

export function readProgress(projectSlug: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey(projectSlug));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeProgress(projectSlug: string, progress: Record<string, boolean>) {
  try {
    localStorage.setItem(getStorageKey(projectSlug), JSON.stringify(progress));
  } catch {
    // 隐私模式下写入失败时保持内存状态
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: { projectSlug } }));
  }
}

export function clearProgress(projectSlugs: string[]) {
  for (const slug of projectSlugs) {
    try {
      localStorage.removeItem(getStorageKey(slug));
    } catch {
      // 忽略
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  }
}

export type ProgressCourse = {
  slug: string;
  shortTitle: string;
  title: string;
  level: string;
  chapters: string[];
};

export type CourseProgressState = {
  slug: string;
  done: number;
  total: number;
  percent: number;
  nextChapter: string | null;
  firstChapter: string | null;
};

export function computeProgress(courses: ProgressCourse[]): CourseProgressState[] {
  return courses.map((course) => {
    const progress = readProgress(course.slug);
    const done = course.chapters.filter((slug) => progress[slug]).length;
    const total = course.chapters.length;
    return {
      slug: course.slug,
      done,
      total,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      nextChapter: course.chapters.find((slug) => !progress[slug]) ?? null,
      firstChapter: course.chapters[0] ?? null,
    };
  });
}
