const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const updateProductTypes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update flowers (by name or category)
    const flowerResult = await Product.updateMany(
      { 
        $or: [
          { name: { $in: ['rose', 'lily', 'tulip', 'sunflower', 'orchid'] } },
          { category: { $in: ['Roses', 'Tulips', 'Lilies', 'Orchids', 'Sunflowers', 'Mixed Bouquets'] } }
        ]
      },
      { $set: { type: 'flower' } }
    );
    console.log(`✅ Updated ${flowerResult.modifiedCount} flowers`);

    // Update plants (by name or category)
    const plantResult = await Product.updateMany(
      { 
        $or: [
          { name: { $in: ['snake plant', 'peace lily', 'monstera', 'succulent', 'cactus', 'fern', 'pothos', 'zz plant'] } },
          { category: { $in: ['Snake Plant', 'Peace Lily', 'Monstera', 'Succulents', 'Cactus', 'Fern'] } }
        ]
      },
      { $set: { type: 'indoor' } }
    );
    console.log(`✅ Updated ${plantResult.modifiedCount} plants`);

    // Set default for any remaining products
    const defaultResult = await Product.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'flower' } }
    );
    console.log(`✅ Set default type for ${defaultResult.modifiedCount} products`);

    console.log('✅ All products updated successfully');
  } catch (error) {
    console.error('❌ Error updating products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

updateProductTypes();