/**
 * Generate a tracked affiliate URL with SmartShop AI referral parameters.
 * @param {string} baseUrl - Original affiliate link URL
 * @param {string} productId - Product ObjectId
 * @param {string} retailer - Retailer name
 * @param {string|null} userId - Authenticated user ID (nullable)
 * @param {string|null} sessionId - Session identifier (nullable)
 * @returns {string} Full tracked URL with query params
 */
export const generateTrackedUrl = (baseUrl, productId, retailer, userId = null, sessionId = null) => {
  try {
    const url = new URL(baseUrl);

    url.searchParams.set('ref', 'smartshop');
    url.searchParams.set('pid', productId.toString());

    if (userId) {
      url.searchParams.set('uid', userId.toString());
    }

    if (sessionId) {
      url.searchParams.set('sid', sessionId);
    }

    url.searchParams.set('retailer', retailer);

    return url.toString();
  } catch (error) {
    // If URL parsing fails, append params manually
    const separator = baseUrl.includes('?') ? '&' : '?';
    let tracked = `${baseUrl}${separator}ref=smartshop&pid=${productId}&retailer=${encodeURIComponent(retailer)}`;

    if (userId) tracked += `&uid=${userId}`;
    if (sessionId) tracked += `&sid=${sessionId}`;

    return tracked;
  }
};
