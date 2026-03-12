const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '../.env') });

const flowerCategories = [
  { name: 'Roses', type: 'flower', description: 'Beautiful roses for every occasion' },
  { name: 'Tulips', type: 'flower', description: 'Colorful tulips to brighten your day' },
  { name: 'Lilies', type: 'flower', description: 'Elegant lilies for special moments' },
  { name: 'Orchids', type: 'flower', description: 'Exotic orchids that last' },
  { name: 'Sunflowers', type: 'flower', description: 'Cheerful sunflowers that bring sunshine' },
  { name: 'Mixed Bouquets', type: 'flower', description: 'Beautiful mixed arrangements' },
  { name: 'Daisies', type: 'flower', description: 'Simple and cheerful daisies' },
  { name: 'Carnations', type: 'flower', description: 'Long-lasting colorful carnations' }
];

const plantCategories = [
  { name: 'Snake Plant', type: 'plant', description: 'Perfect for beginners, almost unkillable' },
  { name: 'Peace Lily', type: 'plant', description: 'Elegant white flowers, loves indirect light' },
  { name: 'Monstera', type: 'plant', description: 'Iconic split leaves, tropical vibe' },
  { name: 'Succulents', type: 'plant', description: 'Drought-tolerant, various shapes and colors' },
  { name: 'Cactus', type: 'plant', description: 'Desert plants, need minimal water' },
  { name: 'Fern', type: 'plant', description: 'Lush green foliage, loves humidity' },
  { name: 'Pothos', type: 'plant', description: 'Trailing vine, great for hanging baskets' },
  { name: 'ZZ Plant', type: 'plant', description: 'Almost unkillable, thrives on neglect' },
  { name: 'Bonsai', type: 'plant', description: 'Miniature trees, requires pruning' },
  { name: 'Aloe', type: 'plant', description: 'Succulent with medicinal properties' },
  { name: 'Spider Plant', type: 'plant', description: 'Easy care, produces baby plants' },
  { name: 'Rubber Plant', type: 'plant', description: 'Large glossy leaves, air purifying' },
  { name: 'Fiddle Leaf Fig', type: 'plant', description: 'Trendy tree with large violin-shaped leaves' },
  { name: 'Calathea', type: 'plant', description: 'Beautiful patterned leaves, prayer plant' },
  { name: 'Philodendron', type: 'plant', description: 'Heart-shaped leaves, easy to grow' }
];

const createCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing categories (optional - comment out if you want to keep existing)
    // await Category.deleteMany({});
    // console.log('✅ Cleared existing categories');

    // Insert flower categories
    for (const cat of flowerCategories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        { ...cat, slug: cat.name.toLowerCase().replace(/\s+/g, '-') },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Added/Updated ${flowerCategories.length} flower categories`);

    // Insert plant categories
    for (const cat of plantCategories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        { ...cat, slug: cat.name.toLowerCase().replace(/\s+/g, '-') },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Added/Updated ${plantCategories.length} plant categories`);

    console.log('✅ All categories created successfully');
  } catch (error) {
    console.error('❌ Error creating categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

createCategories();