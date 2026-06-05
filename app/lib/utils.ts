import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const normalizeATSTip = (tip: any) => {
  if (typeof tip === "string") {
    return { type: "improve", tip };
  }

  return {
    type: tip?.type === "good" ? "good" : "improve",
    tip: typeof tip?.tip === "string" ? tip.tip : String(tip ?? ""),
  };
};

const normalizeCategoryTip = (tip: any) => {
  if (typeof tip === "string") {
    return {
      type: "improve" as const,
      tip,
      explanation: "",
    };
  }

  return {
    type: tip?.type === "good" ? "good" : "improve",
    tip: typeof tip?.tip === "string" ? tip.tip : String(tip ?? ""),
    explanation: typeof tip?.explanation === "string" ? tip.explanation : "",
  };
};

const normalizeCategory = (category: any) => ({
  score: typeof category?.score === "number" ? category.score : 0,
  tips: Array.isArray(category?.tips)
    ? category.tips.map(normalizeCategoryTip)
    : [],
});

export function normalizeFeedback(feedback: any): Feedback {
  return {
    overallScore:
      typeof feedback?.overallScore === "number"
        ? feedback.overallScore
        : 0,
    ATS: {
      score:
        typeof feedback?.ATS?.score === "number"
          ? feedback.ATS.score
          : 0,
      tips: Array.isArray(feedback?.ATS?.tips)
        ? feedback.ATS.tips.map(normalizeATSTip)
        : [],
    },
    toneAndStyle: normalizeCategory(feedback?.toneAndStyle),
    content: normalizeCategory(feedback?.content),
    structure: normalizeCategory(feedback?.structure),
    skills: normalizeCategory(feedback?.skills),
  };
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  // Determine the appropriate unit by calculating the log
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format with 2 decimal places and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();
