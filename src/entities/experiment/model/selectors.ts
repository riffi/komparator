import { ExperimentFilterInput, ExperimentListItem } from "@/entities/experiment/model/types";

export function filterExperiments(
  experiments: ExperimentListItem[],
  filters: ExperimentFilterInput,
) {
  const query = filters.query.trim().toLowerCase();
  const tagQuery = filters.tagQuery.trim().toLowerCase();

  return [...experiments]
    .filter((experiment) => filters.statuses.includes(experiment.status))
    .filter((experiment) =>
      filters.category === "all" ? true : experiment.categoryId === filters.category,
    )
    .filter((experiment) => {
      if (!query) {
        return true;
      }

      const searchText = [
        experiment.title,
        experiment.description,
        experiment.categoryName,
        ...experiment.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    })
    .filter((experiment) => {
      if (!tagQuery) {
        return true;
      }

      return experiment.tags.some((tag) => tag.toLowerCase().includes(tagQuery));
    })
    .sort((left, right) => {
      switch (filters.sort) {
        case "oldest":
          return Date.parse(left.createdAt) - Date.parse(right.createdAt);
        case "results":
          return right.resultCount - left.resultCount;
        case "rating":
          return (right.avgRating ?? -1) - (left.avgRating ?? -1);
        case "newest":
        default:
          return Date.parse(right.createdAt) - Date.parse(left.createdAt);
      }
    });
}