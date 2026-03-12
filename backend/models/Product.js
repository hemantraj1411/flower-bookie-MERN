const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['flower', 'indoor', 'both'],
    default: 'flower'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  oldPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.Mixed, // Changed to Mixed to accept both ObjectId and string
    required: true
  },
  images: [
    {
      url: String,
      publicId: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }
  ],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  badge: {
    type: String,
    enum: ['New', 'Sale', 'Best Seller', 'Limited', 'Seasonal', ''],
    default: ''
  },
  tags: [String],
  // Plant-specific fields
  careLevel: {
    type: String,
    enum: ['easy', 'moderate', 'expert', ''],
    default: ''
  },
  lightNeeds: {
    type: String,
    enum: ['low', 'medium', 'bright indirect', 'full sun', ''],
    default: ''
  },
  waterNeeds: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'sparingly', ''],
    default: ''
  },
  petFriendly: {
    type: Boolean,
    default: false
  },
  airPurifying: {
    type: Boolean,
    default: false
  },
  specifications: {
    type: Map,
    of: String
  },
  careInstructions: String,
  occasion: [String],
  colors: [String],
  sizes: [String]
}, {
  timestamps: true
});

// Create slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);