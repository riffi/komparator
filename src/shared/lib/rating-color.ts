export function ratingToneClass(value: number) {
  if (value >= 7.5) {
    return "text-emerald-400";
  }

  if (value >= 5) {
    return "text-amber-300";
  }

  return "text-red-400";
}