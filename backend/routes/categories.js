const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');
const { getCache, setCache, invalidateCache } = require('../utils/cache');

// @GET /api/categories — Public: only visible categories, sorted
router.get('/', async (req, res, next) => {
  try {
    const cached = await getCache('categories:visible');
    if (cached) return res.json(cached);

    const categories = await Category.find({ isVisible: true }).sort({ sortOrder: 1, name: 1 });
    await setCache('categories:visible', categories, 3600);
    res.json(categories);
  } catch (err) { next(err); }
});

// @GET /api/categories/all — Admin: all categories
router.get('/all', protect, adminOnly, async (req, res, next) => {
  try {
    const cached = await getCache('categories:all');
    if (cached) return res.json(cached);

    const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 });
    await setCache('categories:all', categories, 3600);
    res.json(categories);
  } catch (err) { next(err); }
});

// @GET /api/categories/:slug — Public: Get single category by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isVisible: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) { next(err); }
});

// @POST /api/categories — Admin: create
router.post('/', protect, adminOnly, upload.single('image'), processImages, async (req, res, next) => {
  try {
    const { name, description, isVisible, showInNav, showInShop, sortOrder, parentCategory } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check uniqueness - append timestamp if slug exists
    const existing = await Category.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const image = req.processedImages?.[0] || req.file?.path || '';

    const category = await Category.create({
      name,
      slug: finalSlug,
      description: description || '',
      image,
      isVisible: isVisible !== 'false',
      showInNav: showInNav !== 'false',
      showInShop: showInShop !== 'false',
      sortOrder: Number(sortOrder) || 0,
      parentCategory: parentCategory || null,
    });

    await invalidateCache('categories:visible');
    await invalidateCache('categories:all');
    res.status(201).json(category);
  } catch (err) { next(err); }
});

// @PUT /api/categories/:id — Admin: update
router.put('/:id', protect, adminOnly, upload.single('image'), processImages, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, description, isVisible, showInNav, showInShop, sortOrder, parentCategory } = req.body;

    if (name !== undefined) {
      category.name = name;
      // Regenerate slug only if name changed
      const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
      category.slug = existing ? `${newSlug}-${Date.now()}` : newSlug;
    }
    if (description !== undefined) category.description = description;
    if (isVisible !== undefined) category.isVisible = isVisible === 'true' || isVisible === true;
    if (showInNav !== undefined) category.showInNav = showInNav === 'true' || showInNav === true;
    if (showInShop !== undefined) category.showInShop = showInShop === 'true' || showInShop === true;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (req.processedImages?.[0]) category.image = req.processedImages[0];

    await category.save();
    await invalidateCache('categories:visible');
    await invalidateCache('categories:all');
    res.json(category);
  } catch (err) { next(err); }
});

// @DELETE /api/categories/:id — Admin: delete
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    await invalidateCache('categories:visible');
    await invalidateCache('categories:all');
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
