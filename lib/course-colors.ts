const COURSE_COLORS = [
  { bg: "bg-purple-50", border: "border-purple-200", icon: "bg-purple-600", text: "text-purple-700", dot: "bg-purple-500" },
  { bg: "bg-blue-50", border: "border-blue-200", icon: "bg-blue-600", text: "text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", icon: "bg-emerald-600", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-amber-50", border: "border-amber-200", icon: "bg-amber-600", text: "text-amber-700", dot: "bg-amber-500" },
  { bg: "bg-rose-50", border: "border-rose-200", icon: "bg-rose-600", text: "text-rose-700", dot: "bg-rose-500" },
  { bg: "bg-cyan-50", border: "border-cyan-200", icon: "bg-cyan-600", text: "text-cyan-700", dot: "bg-cyan-500" },
  { bg: "bg-orange-50", border: "border-orange-200", icon: "bg-orange-600", text: "text-orange-700", dot: "bg-orange-500" },
  { bg: "bg-indigo-50", border: "border-indigo-200", icon: "bg-indigo-600", text: "text-indigo-700", dot: "bg-indigo-500" },
  { bg: "bg-pink-50", border: "border-pink-200", icon: "bg-pink-600", text: "text-pink-700", dot: "bg-pink-500" },
  { bg: "bg-teal-50", border: "border-teal-200", icon: "bg-teal-600", text: "text-teal-700", dot: "bg-teal-500" },
]

export function getCourseColor(index: number) {
  return COURSE_COLORS[index % COURSE_COLORS.length]
}

export function getCourseColorByName(courseName: string) {
  let hash = 0
  for (let i = 0; i < courseName.length; i++) {
    hash = courseName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}
