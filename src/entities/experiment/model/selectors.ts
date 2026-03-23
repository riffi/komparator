import { ExperimentFilterInput, ExperimentListItem } from "@/entities/experiment/model/types";

export function filterExperiments(
  experiments: ExperimentListItem[],
  filters: ExperimentFilterInput,
) {
  const query = filters.query.trim().toLowerCase();

  return [...experiments]
    .filter((experiment) => {
      if (!query) {
        return true;
      }

      return experiment.title.toLowerCase().includes(query);
    })
    .sort((left, right) => {
      switch (filters.sort) {
        case "updated":
          return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
        case "oldest":
          return Date.parse(left.createdAt) - Date.parse(right.createdAt);
        case "title":
          return left.title.localeCompare(right.title);
        case "newest":
        default:
          return Date.parse(right.createdAt) - Date.parse(left.createdAt);
      }
    });
}
