const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, processImages } = require('../middleware/upload');
const { getCache, setCache, invalidateCache } = require('../utils/cache');

// @GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = `products:list:${Buffer.from(JSON.stringify(req.query)).toString('base64')}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const { category, size, color, minPrice, maxPrice, sort, page = 1, limit = 12, search, featured } = req.query;
    const query = {};
    if (category) query.category = category;
    if (size) query.sizes = size;
    if (color) query.colors = color;
    if (featured === 'true') query.isFeatured = true;
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      popular: { numReviews: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    const payload = { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
    await setCache(cacheKey, payload, 300); // 5 mins cache for listings

    res.json(payload);
  } catch (err) { next(err); }
});

// @GET /api/products/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const cacheKey = `product:${req.params.slug}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    await setCache(cacheKey, product, 900); // 15 mins cache
    res.json(product);
  } catch (err) { next(err); }
});

// @POST /api/products (admin)
router.post('/', protect, adminOnly, upload.array('images', 6), processImages, async (req, res, next) => {
  try {
    const { name, description, price, comparePrice, category, sizes, colors, stock, sku, variants, tags, isFeatured, isTrending, isNewArrival, isActive, discount, fabricGsm, fabricMaterial } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const product = await Product.create({
      name, slug, description, price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : undefined,
      images: req.processedImages || [],
      category,
      sku: sku || '',
      variants: variants ? (typeof variants === 'string' ? JSON.parse(variants) : variants) : [],
      sizes: sizes ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim())) : [],
      colors: colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : [],
      stock: Number(stock) || 0,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isTrending: isTrending === 'true' || isTrending === true,
      isNewArrival: isNewArrival === 'true' || isNewArrival === true,
      isActive: isActive !== 'false' && isActive !== false,
      discount: Number(discount) || 0,
      fabric: { gsm: fabricGsm || '', material: fabricMaterial || '' }
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// @POST /api/products/bulk (admin)
router.post('/bulk', protect, adminOnly, async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No valid products provided' });
    }

    const formattedProducts = products.map((p, idx) => {
      const slug = (p.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now() + idx;
      return {
        name: p.name,
        slug,
        description: p.description || '',
        price: Number(p.price) || 0,
        comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
        category: p.category || 'General',
        sku: p.sku || '',
        stock: Number(p.stock) || 0,
        tags: typeof p.tags === 'string' ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        sizes: typeof p.sizes === 'string' ? p.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
        colors: typeof p.colors === 'string' ? p.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        isActive: p.isActive !== 'false' && p.isActive !== false,
      };
    });

    const inserted = await Product.insertMany(formattedProducts);
    res.status(201).json({ message: `${inserted.length} products imported successfully`, count: inserted.length });
  } catch (err) { next(err); }
});

// @PUT /api/products/:id (admin)
router.put('/:id', protect, adminOnly, upload.array('images', 6), processImages, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const fields = ['name', 'description', 'price', 'comparePrice', 'category', 'stock', 'sku', 'isFeatured', 'isTrending', 'isNewArrival', 'isActive', 'discount'];
    fields.forEach(f => { 
      if (req.body[f] !== undefined) {
        if (['isFeatured', 'isTrending', 'isNewArrival', 'isActive'].includes(f)) {
          product[f] = req.body[f] === 'true' || req.body[f] === true;
        } else {
          product[f] = req.body[f];
        }
      } 
    });

    if (req.body.variants) {
      product.variants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
    }

    if (req.body.fabricGsm !== undefined || req.body.fabricMaterial !== undefined) {
      if (!product.fabric) product.fabric = {};
      if (req.body.fabricGsm !== undefined) product.fabric.gsm = req.body.fabricGsm;
      if (req.body.fabricMaterial !== undefined) product.fabric.material = req.body.fabricMaterial;
    }

    if (req.body.sizes) product.sizes = Array.isArray(req.body.sizes) ? req.body.sizes : req.body.sizes.split(',').map(s => s.trim());
    if (req.body.colors) product.colors = Array.isArray(req.body.colors) ? req.body.colors : req.body.colors.split(',').map(c => c.trim());
    if (req.body.tags) product.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim());
    
    // Explicitly handle "empty tags" if user clears the input
    if (req.body.tags === '') product.tags = [];

    if (req.processedImages && req.processedImages.length > 0) product.images = [...product.images, ...req.processedImages];

    await product.save();
    await invalidateCache(`product:${product.slug}`);
    
    res.json(product);
  } catch (err) { next(err); }
});

// @DELETE /api/products/:id (admin)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    await invalidateCache(`product:${product.slug}`);
    res.json({ message: 'Product deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
