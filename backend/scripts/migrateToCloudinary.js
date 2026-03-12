const mongoose = require('mongoose');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const migrateToCloudinary = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products to check`);

    let migratedCount = 0;

    for (const product of products) {
      let modified = false;
      
      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          const img = product.images[i];
          
          // Skip if already Cloudinary URL
          if (img.url && img.url.includes('cloudinary.com')) {
            console.log(`⏭️  Product ${product.name} already has Cloudinary image`);
            continue;
          }

          // Check if it's a local file path
          if (img.url && (img.url.includes('/uploads/') || img.url.startsWith('http://localhost'))) {
            // Extract filename
            const filename = img.url.split('/').pop();
            const filePath = path.join(__dirname, '../uploads', filename);
            
            // Check if file exists locally
            if (fs.existsSync(filePath)) {
              try {
                console.log(`📤 Uploading ${filename} to Cloudinary...`);
                
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(filePath, {
                  folder: 'flowerbookie/products',
                  public_id: `product-${Date.now()}-${i}`,
                  transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
                });
                
                // Update image URL and publicId
                product.images[i].url = result.secure_url;
                product.images[i].publicId = result.public_id;
                modified = true;
                
                console.log(`✅ Uploaded: ${result.secure_url}`);
                
                // Optionally delete local file after successful upload
                // fs.unlinkSync(filePath);
                // console.log(`🗑️ Deleted local file: ${filename}`);
                
              } catch (uploadError) {
                console.error(`❌ Failed to upload ${filename}:`, uploadError.message);
              }
            } else {
              console.log(`⚠️ Local file not found: ${filename}`);
              
              // Replace with placeholder
              product.images[i].url = 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
              product.images[i].publicId = `placeholder-${Date.now()}`;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        await product.save();
        migratedCount++;
        console.log(`✅ Updated product: ${product.name}`);
      }
    }

    console.log(`\n🎉 Migration complete! Updated ${migratedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateToCloudinary();