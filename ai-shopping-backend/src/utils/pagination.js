/**
 * Paginate a Mongoose query.
 * @param {import('mongoose').Model} model - Mongoose model
 * @param {Object} query - Mongoose filter query
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Items per page (default 12, max 50)
 * @param {string|Object|Array} populateFields - Fields to populate (optional)
 * @param {Object} sortOptions - Sort options (optional, default { createdAt: -1 })
 * @returns {Object} { data, pagination }
 */
export const paginate = async (model, query = {}, page = 1, limit = 12, populateFields = null, sortOptions = { createdAt: -1 }) => {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  const total = await model.countDocuments(query);
  const totalPages = Math.ceil(total / limit) || 1;
  const skip = (page - 1) * limit;

  let dbQuery = model.find(query).sort(sortOptions).skip(skip).limit(limit);

  if (populateFields) {
    if (Array.isArray(populateFields)) {
      for (const field of populateFields) {
        dbQuery = dbQuery.populate(field);
      }
    } else {
      dbQuery = dbQuery.populate(populateFields);
    }
  }

  const data = await dbQuery.lean();

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export default paginate;
