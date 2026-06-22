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
 * Call OpenAI with automatic retry on rate limit (429) errors.
 * @param {Object} params - OpenAI chat completion params
 * @param {number} retries - Max retry attempts
 */
const callOpenAIWithRetry = async (params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.chat.completions.create(params)
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes('rate limit')
      const isLastAttempt = i === retries - 1
      if (isRateLimit && !isLastAttempt) {
        const delay = 1000 * Math.pow(2, i) // 1s, 2s, 4s
        console.warn(`[AI Service] Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${retries})`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
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
    const completion = await callOpenAIWithRetry({
      model: config.OPENAI_MODEL,
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a shopping assistant search interpreter. Given a user's natural language search query, extract structured search filters.\nReturn ONLY valid JSON with this exact shape:\n{\n  "summary": "brief human-readable interpretation of the query",\n  "filters": {\n    "category": "string or null",\n    "brands": ["array of brand strings"] or null,\n    "priceMin": number or null,\n    "priceMax": number or null,\n    "ramMin": number or null,\n    "batteryMin": number or null,\n    "features": ["array of feature strings"] or null\n  },\n  "filterTags": ["array of tag strings for UI display"]\n}\nDo not include any explanation, markdown, or extra text. Only output valid JSON.`,
        },
        {
          role: 'user',
          content: rawQuery,
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    // Validate response shape
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid AI response structure')
    }
    if (!parsed.summary) parsed.summary = rawQuery
    if (!parsed.filters || typeof parsed.filters !== 'object') parsed.filters = {}
    if (!Array.isArray(parsed.filterTags)) parsed.filterTags = []

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

    const completion = await callOpenAIWithRetry({
      model: config.OPENAI_MODEL,
      max_tokens: 1000,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `You are a tech product comparison expert. Given a set of products with their specs and prices, provide a comparison verdict.\nReturn ONLY valid JSON with this shape:\n{\n  "narrative": "A 2-3 paragraph comparison narrative covering key differences",\n  "proPick": { "productId": "id of best overall pick", "reason": "short reason" },\n  "budgetPick": { "productId": "id of best value pick", "reason": "short reason" }\n}\nOnly output valid JSON.`,
        },
        {
          role: 'user',
          content: JSON.stringify(productSummaries),
        },
      ],
    });

    const content = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    if (!parsed || !parsed.narrative) {
      throw new Error('Invalid comparison verdict structure')
    }
    if (!parsed.proPick) parsed.proPick = null
    if (!parsed.budgetPick) parsed.budgetPick = null

    return parsed;
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

    const completion = await callOpenAIWithRetry({
      model: config.OPENAI_MODEL,
      max_tokens: 1000,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `You are a product review expert. Given a product's details, generate a balanced AI review.\nReturn ONLY valid JSON with this shape:\n{\n  "pros": ["exactly 4 concise pro points"],\n  "cons": ["exactly 3 concise con points"],\n  "expertSummary": "A 2-3 sentence expert summary"\n}\nOnly output valid JSON.`,
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

    if (!parsed || !Array.isArray(parsed.pros) || !Array.isArray(parsed.cons)) {
      throw new Error('Invalid AI review structure')
    }
    if (!parsed.expertSummary) parsed.expertSummary = ''
    // Ensure exactly 4 pros and 3 cons
    parsed.pros = parsed.pros.slice(0, 4)
    parsed.cons = parsed.cons.slice(0, 3)

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

    // subcategories live in a separate collection — use name safely with fallback
    const subcategoryNames = Array.isArray(category.subcategories) && category.subcategories.length > 0
      ? category.subcategories.join(', ')
      : 'none';

    const completion = await callOpenAIWithRetry({
      model: config.OPENAI_MODEL,
      max_tokens: 1000,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: 'You are a market analyst. Given a product category, provide a 2-3 sentence market insight about current trends, popular features, and buying advice. Return only the insight text, no JSON.',
        },
        {
          role: 'user',
          content: `Category: ${category.name} (subcategories: ${subcategoryNames})`,
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

    const completion = await callOpenAIWithRetry({
      model: config.OPENAI_MODEL,
      max_tokens: 1000,
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
