/**
 * Convert text into a URL-friendly slug.
 * - Lowercase
 * - Replace spaces/underscores with hyphens
 * - Remove special characters
 * - Collapse multiple hyphens
 * - Trim leading/trailing hyphens
 *
 * @param {string} text - Raw text to slugify
 * @returns {string} URL-friendly slug
 */
export const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')       // Replace spaces & underscores with hyphens
    .replace(/[^\w-]+/g, '')       // Remove all non-word characters except hyphens
    .replace(/--+/g, '-')          // Collapse multiple hyphens
    .replace(/^-+/, '')            // Trim leading hyphens
    .replace(/-+$/, '');           // Trim trailing hyphens
};

export default slugify;
