import OpenAI from 'openai';
import config from '../config/env.js';
import Product from '../models/Product.js';
import AiReview from '../models/AiReview.js';
import Category from '../models/Category.js';

let openai = null;

if (config.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
}

/**
 * Interpret a raw search query using GPT-4o, extracting structured filters.
 * @param {string} rawQuery
 * @returns {Object} { summary, filters, filterTags }
 */
export const interpretSearchQuery = async (rawQuery) => {
  if (!openai) {
    return { summary: rawQuery, filters: {}, filterTags: [] };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a shopping assistant search interpreter. Given a user's natural language search query, extract structured search filters.
Return ONLY valid JSON with this exact shape:
{
  "summary": "brief human-readable interpretation of the query",
  "filters": {
    "category": "string or null",
    "brands": ["array of brand strings"] or null,
    "priceMin": number or null,
    "priceMax": number or null,
    "ramMin": number or null,
    "batteryMin": number or null,
    "features": ["array of feature strings"] or null
  },
  "filterTags": ["array of tag strings for UI display"]
}
Do not include any explanation, markdown, or extra text. Only output valid JSON.`,
        },
        {
          role: 'user',
          content: rawQuery,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error(`[AI Service] interpretSearchQuery error: ${error.message}`);
    return { summary: rawQuery, filters: {}, filterTags: [] };
  }
};

/**
 * Generate an AI comparison verdict for a set of products.
 * @param {Array} products - Array of product objects with specs
 * @returns {Object|null} { narrative, proPick, budgetPick }
 */
export const generateComparisonVerdict = async (products) => {
  if (!openai) return null;

  try {
    const productSummaries = products.map((p) => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      price: p.currentPrice,
      rating: p.rating,
      specs: p.specs,
    }));

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `You are a tech product comparison expert. Given a set of products with their specs and prices, provide a comparison verdict.
Return ONLY valid JSON with this shape:
{
  "narrative": "A 2-3 paragraph comparison narrative covering key differences",
  "proPick": { "productId": "id of best overall pick", "reason": "short reason" },
  "budgetPick": { "productId": "id of best value pick", "reason": "short reason" }
}
Only output valid JSON.`,
        },
        {
          role: 'user',
          content: JSON.stringify(productSummaries),
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();
    return JSON.parse(content);
  } catch (error) {
    console.error(`[AI Service] generateComparisonVerdict error: ${error.message}`);
    return null;
  }
};

/**
 * Generate an AI review (pros/cons/summary) for a product and save it.
 * @param {string} productId
 * @returns {Object|null} AiReview document
 */
export const generateAiReview = async (productId) => {
  if (!openai) return null;

  try {
    const product = await Product.findById(productId).lean();
    if (!product) return null;

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `You are a product review expert. Given a product's details, generate a balanced AI review.
Return ONLY valid JSON with this shape:
{
  "pros": ["exactly 4 concise pro points"],
  "cons": ["exactly 3 concise con points"],
  "expertSummary": "A 2-3 sentence expert summary"
}
Only output valid JSON.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            name: product.name,
            brand: product.brand,
            price: product.currentPrice,
            rating: product.rating,
            specs: product.specs,
            description: product.description,
          }),
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    const aiReview = await AiReview.findOneAndUpdate(
      { productId },
      {
        productId,
        pros: parsed.pros,
        cons: parsed.cons,
        expertSummary: parsed.expertSummary,
        reviewsAnalyzed: product.reviewCount || 0,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return aiReview;
  } catch (error) {
    console.error(`[AI Service] generateAiReview error: ${error.message}`);
    return null;
  }
};

/**
 * Generate a market insight for a category.
 * @param {string} categorySlug
 * @returns {string|null} Insight text
 */
export const generateCategoryInsight = async (categorySlug) => {
  if (!openai) return null;

  try {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) return null;

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: 'You are a market analyst. Given a product category, provide a 2-3 sentence market insight about current trends, popular features, and buying advice. Return only the insight text, no JSON.',
        },
        {
          role: 'user',
          content: `Category: ${category.name} (subcategories: ${category.subcategories.join(', ') || 'none'})`,
        },
      ],
    });

    const insight = completion.choices[0].message.content.trim();

    category.aiInsight = insight;
    category.aiInsightUpdatedAt = new Date();
    await category.save();

    return insight;
  } catch (error) {
    console.error(`[AI Service] generateCategoryInsight error: ${error.message}`);
    return null;
  }
};

/**
 * Generate an expert summary for search results.
 * @param {string} query - User query
 * @param {Array} products - Array of product results
 * @returns {string|null} Summary text
 */
export const generateSearchExpertSummary = async (query, products) => {
  if (!openai) return null;

  try {
    const productSnippets = products.slice(0, 5).map((p) => ({
      name: p.name,
      brand: p.brand,
      price: p.currentPrice,
      rating: p.rating,
    }));

    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: 'You are a shopping expert. Given a search query and top product results, provide a 2-3 sentence expert summary helping the user choose. Return only the summary text, no JSON.',
        },
        {
          role: 'user',
          content: `Query: "${query}"\nTop results: ${JSON.stringify(productSnippets)}`,
        },
      ],
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error(`[AI Service] generateSearchExpertSummary error: ${error.message}`);
    return null;
  }
};
