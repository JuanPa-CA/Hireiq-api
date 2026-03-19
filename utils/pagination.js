const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 10;

  if (limit > 100) limit = 100;
  
  const skip = (page - 1) * limit;

  return { skip, limit, page };
};

const buildPaginationMeta = (total, page, limit) => {
  const total_pages = Math.ceil(total / limit);
  
  return {
    page,
    total,
    per_page: limit,
    total_pages
  };
};

module.exports = {
  getPaginationParams,
  buildPaginationMeta
};
