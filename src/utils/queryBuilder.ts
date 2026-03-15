const queryBuilder = (query: Record<string, unknown>) => {
  const page = Number(query.page ?? 1);
  const limit = Math.min(Number(query.limit ?? 10), 100);
  const searchTerm = typeof query.searchTerm === "string" ? query.searchTerm.trim() : undefined;
  const sortBy = typeof query.sortBy === "string" ? query.sortBy : undefined;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  return {
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    limit: Number.isNaN(limit) || limit < 1 ? 10 : limit,
    skip: ((Number.isNaN(page) || page < 1 ? 1 : page) - 1) * (Number.isNaN(limit) || limit < 1 ? 10 : limit),
    take: Number.isNaN(limit) || limit < 1 ? 10 : limit,
    searchTerm,
    sortBy,
    sortOrder,
  } as const;
};

export default queryBuilder;
