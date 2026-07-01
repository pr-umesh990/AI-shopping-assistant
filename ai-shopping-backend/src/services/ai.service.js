import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env.js';
import Product from '../models/Product.js';
import AiReview from '../models/AiReview.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

let geminiModel = null;

if (config.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });
}

/**
 * Call Gemini with automatic retry on rate limit (429) errors.
 * @param {string} systemPrompt - System instruction for the model
 * @param {string} userPrompt  - User message
 * @param {number} temperature - Sampling temperature
 * @param {number} retries     - Max retry attempts
 * @returns {string} Raw text response from Gemini
 */
const callGeminiWithRetry = async (systemPrompt, userPrompt, temperature = 0.5, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          maxOutputTokens: 1000,
          temperature,
        },
      });
      return result.response.text();
    } catch (err) {
      const isRateLimit =
        err.status === 429 ||
        err.message?.includes('429') ||
        err.message?.includes('quota') ||
        err.message?.includes('rate limit');
      const isLastAttempt = i === retries - 1;
      if (isRateLimit && !isLastAttempt) {
        const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
        console.warn(`[AI Service] Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
};

/**
 * Strip markdown fences from a JSON response (Gemini sometimes wraps with ```json).
 * @param {string} text
 * @returns {string} clean JSON string
 */
const stripMarkdownFences = (text) => {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
};

/**
 * Interpret a raw search query using Gemini, extracting structured filters.
 * @param {string} rawQuery
 * @returns {Object} { summary, filters, filterTags }
 */
export const interpretSearchQuery = async (rawQuery) => {
  if (!geminiModel) {
    return { summary: rawQuery, filters: {}, filterTags: [] };
  }

  try {
    const systemPrompt = `You are a shopping assistant search interpreter. Given a user's natural language search query, extract structured search filters.
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
Do not include any explanation, markdown, or extra text. Only output valid JSON.`;

    const rawText = await callGeminiWithRetry(systemPrompt, rawQuery, 0.3);
    const parsed = JSON.parse(stripMarkdownFences(rawText));

    // Validate response shape
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid AI response structure');
    }
    if (!parsed.summary) parsed.summary = rawQuery;
    if (!parsed.filters || typeof parsed.filters !== 'object') parsed.filters = {};
    if (!Array.isArray(parsed.filterTags)) parsed.filterTags = [];

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
  if (!geminiModel) return null;

  try {
    const productSummaries = products.map((p) => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      price: p.currentPrice,
      rating: p.rating,
      specs: p.specs,
    }));

    const systemPrompt = `You are a tech product comparison expert. Given a set of products with their specs and prices, provide a comparison verdict.
Return ONLY valid JSON with this shape:
{
  "narrative": "A 2-3 paragraph comparison narrative covering key differences",
  "proPick": { "productId": "id of best overall pick", "reason": "short reason" },
  "budgetPick": { "productId": "id of best value pick", "reason": "short reason" }
}
Only output valid JSON.`;

    const rawText = await callGeminiWithRetry(systemPrompt, JSON.stringify(productSummaries), 0.5);
    const parsed = JSON.parse(stripMarkdownFences(rawText));

    if (!parsed || !parsed.narrative) {
      throw new Error('Invalid comparison verdict structure');
    }
    if (!parsed.proPick) parsed.proPick = null;
    if (!parsed.budgetPick) parsed.budgetPick = null;

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
  if (!geminiModel) return null;

  try {
    const product = await Product.findById(productId).lean();
    if (!product) return null;

    const systemPrompt = `You are a product review expert. Given a product's details, generate a balanced AI review.
Return ONLY valid JSON with this shape:
{
  "pros": ["exactly 4 concise pro points"],
  "cons": ["exactly 3 concise con points"],
  "expertSummary": "A 2-3 sentence expert summary"
}
Only output valid JSON.`;

    const userPrompt = JSON.stringify({
      name: product.name,
      brand: product.brand,
      price: product.currentPrice,
      rating: product.rating,
      specs: product.specs,
      description: product.description,
    });

    const rawText = await callGeminiWithRetry(systemPrompt, userPrompt, 0.5);
    const parsed = JSON.parse(stripMarkdownFences(rawText));

    if (!parsed || !Array.isArray(parsed.pros) || !Array.isArray(parsed.cons)) {
      throw new Error('Invalid AI review structure');
    }
    if (!parsed.expertSummary) parsed.expertSummary = '';
    // Ensure exactly 4 pros and 3 cons
    parsed.pros = parsed.pros.slice(0, 4);
    parsed.cons = parsed.cons.slice(0, 3);

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
  if (!geminiModel) return null;

  try {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) return null;

    // Fetch actual subcategories from separate collection
    const subcategoryDocs = await Subcategory.find({
      categoryId: category._id,
      isActive: true
    }).select('name').lean();

    const subcategoryNames = subcategoryDocs.length > 0
      ? subcategoryDocs.map(s => s.name).join(', ')
      : 'none';

    const systemPrompt =
      'You are a market analyst. Given a product category, provide a 2-3 sentence market insight about current trends, popular features, and buying advice. Return only the insight text, no JSON.';

    const insight = await callGeminiWithRetry(
      systemPrompt,
      `Category: ${category.name} (subcategories: ${subcategoryNames})`,
      0.6
    );

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
 * @param {string} query    - User query
 * @param {Array} products  - Array of product results
 * @returns {string|null} Summary text
 */
export const generateSearchExpertSummary = async (query, products) => {
  if (!geminiModel) return null;

  try {
    const productSnippets = products.slice(0, 5).map((p) => ({
      name: p.name,
      brand: p.brand,
      price: p.currentPrice,
      rating: p.rating,
    }));

    const systemPrompt =
      'You are a shopping expert. Given a search query and top product results, provide a 2-3 sentence expert summary helping the user choose. Return only the summary text, no JSON.';

    return await callGeminiWithRetry(
      systemPrompt,
      `Query: "${query}"\nTop results: ${JSON.stringify(productSnippets)}`,
      0.5
    );
  } catch (error) {
    console.error(`[AI Service] generateSearchExpertSummary error: ${error.message}`);
    return null;
  }
};
