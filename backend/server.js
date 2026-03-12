const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { initializeSocket } = require('./socket/socketServer');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// IMPORTANT: Define uploads directory path
const uploadsDir = path.join(__dirname, 'uploads');
console.log('📁 Uploads directory path:', uploadsDir);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory already exists');
  const files = fs.readdirSync(uploadsDir);
  console.log(`📋 Files in uploads (${files.length}):`, files);
}

// CRITICAL: Static file serving
app.use('/uploads', express.static(uploadsDir));

// Debug endpoint to check paths
app.get('/debug-paths', (req, res) => {
  const testFile = 'product-1771477809299-925585399.jpg';
  const filePath = path.join(uploadsDir, testFile);
  
  res.json({
    uploadsDir: uploadsDir,
    dirExists: fs.existsSync(uploadsDir),
    files: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [],
    testFile: {
      name: testFile,
      exists: fs.existsSync(filePath),
      path: filePath,
      url: `/uploads/${testFile}`,
      fullUrl: `http://localhost:5000/uploads/${testFile}`
    }
  });
});

// Test route to verify static file serving
app.get('/api/test-static', (req, res) => {
  const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
  const fileList = files.map(f => ({
    name: f,
    url: `/uploads/${f}`,
    fullUrl: `http://localhost:5000/uploads/${f}`,
    exists: fs.existsSync(path.join(uploadsDir, f))
  }));
  
  res.json({
    message: 'Static file serving test',
    uploadsDir: uploadsDir,
    dirExists: fs.existsSync(uploadsDir),
    fileCount: files.length,
    files: fileList
  });
});

// Direct test for the specific image
app.get('/api/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.send(`
      <html>
        <head><title>Image Test</title></head>
        <body>
          <h1>Image Test</h1>
          <p>Filename: ${filename}</p>
          <p>File exists: ✅ YES</p>
          <p>File path: ${filePath}</p>
          <h2>Image:</h2>
          <img src="/uploads/${filename}" style="max-width: 500px; border: 1px solid #ccc;" />
          <h2>Direct Link:</h2>
          <p><a href="/uploads/${filename}" target="_blank">/uploads/${filename}</a></p>
          <p><a href="/debug-paths">Check Debug Paths</a></p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <head><title>Image Test</title></head>
        <body>
          <h1>Image Test</h1>
          <p>Filename: ${filename}</p>
          <p>File exists: ❌ NO</p>
          <p>File path: ${filePath}</p>
          <p>Files in directory: ${fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).join(', ') : 'Directory not found'}</p>
          <p><a href="/debug-paths">Check Debug Paths</a></p>
        </body>
      </html>
    `);
  }
});

// Debug endpoint to check a specific file
app.get('/api/debug/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  const exists = fs.existsSync(filePath);
  
  res.json({
    filename,
    exists,
    path: filePath,
    uploadsDir,
    dirExists: fs.existsSync(uploadsDir),
    allFiles: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
  });
});

// Debug endpoint to check product images
app.get('/api/debug/product/:id', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const imageDetails = await Promise.all((product.images || []).map(async (img) => {
      if (typeof img === 'string') {
        const filename = path.basename(img);
        const filePath = path.join(uploadsDir, filename);
        const exists = fs.existsSync(filePath);
        let stats = null;
        
        if (exists) {
          stats = fs.statSync(filePath);
        }
        
        return {
          url: img,
          filename: filename,
          fileExists: exists,
          fileSize: stats?.size,
          filePath: filePath,
          testUrl: `http://localhost:5000${img}`,
          allFiles: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
        };
      } else {
        const filePath = path.join(uploadsDir, img.publicId);
        const exists = fs.existsSync(filePath);
        let stats = null;
        
        if (exists) {
          stats = fs.statSync(filePath);
        }
        
        return {
          ...img.toObject(),
          fileExists: exists,
          fileSize: stats?.size,
          filePath: filePath,
          testUrl: `http://localhost:5000${img.url}`,
          allFiles: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : []
        };
      }
    }));
    
    res.json({
      productId: product._id,
      productName: product.name,
      productType: product.type,
      images: imageDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import routes
const productRoutes = require('./routes/productRoutes');
const plantRoutes = require('./routes/plantRoutes');
const flowerRoutes = require('./routes/flowerRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/flowers', flowerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// FIXED: Mount delivery routes at the root level since they already have /admin/delivery prefix
app.use('/api', deliveryRoutes);

// Add a simple test route for delivery
app.get('/api/delivery-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Delivery test route is working!',
    timestamp: new Date().toISOString()
  });
});

// Debug route to check all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly
      const methods = Object.keys(middleware.route.methods);
      routes.push({
        path: middleware.route.path,
        methods: methods
      });
    } else if (middleware.name === 'router') {
      // Routes registered via router
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods);
          routes.push({
            path: path,
            methods: methods
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Registered routes',
    routes: routes.slice(0, 20) // Show first 20 routes
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uploads: {
      path: uploadsDir,
      exists: fs.existsSync(uploadsDir),
      fileCount: files.length,
      files: files
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: err.errors 
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ 
      message: 'Duplicate key error', 
      field: Object.keys(err.keyPattern)[0] 
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Connected');
    
    // Create default categories
    createDefaultCategories();
    
    const PORT = process.env.PORT || 5000;
    
    // Create HTTP server for Socket.IO
    const server = http.createServer(app);
    
    // Initialize Socket.IO
    const io = initializeSocket(server);
    
    // Start server with Socket.IO
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.IO server initialized`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`🖼️ Test static file serving: http://localhost:${PORT}/api/test-static`);
      console.log(`🖼️ Direct image URL: http://localhost:${PORT}/uploads/product-1771477809299-925585399.jpg`);
      console.log(`🔍 Debug paths: http://localhost:${PORT}/debug-paths`);
      console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug/routes`);
      console.log(`🌿 Plant routes: http://localhost:${PORT}/api/plants`);
      console.log(`🌸 Flower routes: http://localhost:${PORT}/api/flowers`);
      console.log(`📦 Product routes: http://localhost:${PORT}/api/products`);
      console.log(`💰 Payment routes: http://localhost:${PORT}/api/payment/test`);
      console.log(`🚚 Delivery routes: http://localhost:${PORT}/api/admin/delivery/test`);
      console.log(`🚚 Delivery boys: http://localhost:${PORT}/api/admin/delivery/boys`);
      console.log(`🚚 Active orders: http://localhost:${PORT}/api/admin/delivery/active-orders`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Function to create default categories
const createDefaultCategories = async () => {
  try {
    const Category = require('./models/Category');
    const count = await Category.countDocuments();
    
    if (count === 0) {
      // Flower categories
      const flowerCategories = [
        { name: 'Roses', slug: 'roses', description: 'Beautiful roses for every occasion' },
        { name: 'Tulips', slug: 'tulips', description: 'Colorful tulips to brighten your day' },
        { name: 'Lilies', slug: 'lilies', description: 'Elegant lilies for special moments' },
        { name: 'Orchids', slug: 'orchids', description: 'Exotic orchids that last' },
        { name: 'Sunflowers', slug: 'sunflowers', description: 'Cheerful sunflowers that bring sunshine' },
        { name: 'Mixed Bouquets', slug: 'mixed-bouquets', description: 'Beautiful mixed arrangements' },
        { name: 'Daisies', slug: 'daisies', description: 'Simple and cheerful daisies' },
        { name: 'Carnations', slug: 'carnations', description: 'Long-lasting colorful carnations' },
        { name: 'Chrysanthemums', slug: 'chrysanthemums', description: 'Beautiful mums for fall' },
        { name: 'Peonies', slug: 'peonies', description: 'Lush, romantic peonies' },
        { name: 'Hydrangeas', slug: 'hydrangeas', description: 'Full, beautiful hydrangeas' }
      ];
      
      // Plant categories
      const plantCategories = [
        { name: 'Snake Plant', slug: 'snake-plant', description: 'Perfect for beginners, almost unkillable' },
        { name: 'Peace Lily', slug: 'peace-lily', description: 'Elegant white flowers, loves indirect light' },
        { name: 'Monstera', slug: 'monstera', description: 'Iconic split leaves, tropical vibe' },
        { name: 'Succulents', slug: 'succulents', description: 'Drought-tolerant, various shapes and colors' },
        { name: 'Cactus', slug: 'cactus', description: 'Desert plants, need minimal water' },
        { name: 'Fern', slug: 'fern', description: 'Lush green foliage, loves humidity' },
        { name: 'Pothos', slug: 'pothos', description: 'Trailing vine, great for hanging baskets' },
        { name: 'ZZ Plant', slug: 'zz-plant', description: 'Almost unkillable, thrives on neglect' },
        { name: 'Bonsai', slug: 'bonsai', description: 'Miniature trees, requires pruning' },
        { name: 'Aloe', slug: 'aloe', description: 'Succulent with medicinal properties' },
        { name: 'Spider Plant', slug: 'spider-plant', description: 'Easy care, produces baby plants' },
        { name: 'Rubber Plant', slug: 'rubber-plant', description: 'Bold, glossy leaves' },
        { name: 'Fiddle Leaf Fig', slug: 'fiddle-leaf-fig', description: 'Trendy, large-leaf plant' },
        { name: 'Calathea', slug: 'calathea', description: 'Stunning patterned leaves' },
        { name: 'Philodendron', slug: 'philodendron', description: 'Versatile, easy to grow' }
      ];
      
      // Insert all categories
      await Category.insertMany([...flowerCategories, ...plantCategories]);
      console.log('✅ Default categories created successfully');
    } else {
      console.log(`📋 Found ${count} existing categories`);
    }
  } catch (error) {
    console.error('❌ Error creating default categories:', error);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

module.exports = app;