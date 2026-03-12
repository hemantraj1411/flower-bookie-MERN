// Product categories including indoor plants
export const PRODUCT_CATEGORIES = [
  // Flower Categories
  { id: 'roses', name: 'Roses', type: 'flower', icon: '🌹' },
  { id: 'tulips', name: 'Tulips', type: 'flower', icon: '🌷' },
  { id: 'lilies', name: 'Lilies', type: 'flower', icon: '🌸' },
  { id: 'orchids', name: 'Orchids', type: 'flower', icon: '🌺' },
  { id: 'sunflowers', name: 'Sunflowers', type: 'flower', icon: '🌻' },
  { id: 'daisies', name: 'Daisies', type: 'flower', icon: '🌼' },
  { id: 'carnations', name: 'Carnations', type: 'flower', icon: '🌸' },
  { id: 'peonies', name: 'Peonies', type: 'flower', icon: '🌺' },
  { id: 'hydrangeas', name: 'Hydrangeas', type: 'flower', icon: '🌸' },
  { id: 'mixed', name: 'Mixed Bouquets', type: 'flower', icon: '💐' },
  
  // Indoor Plants
  { id: 'snake-plant', name: 'Snake Plant', type: 'indoor', icon: '🌿', care: 'Low light, water every 2-3 weeks' },
  { id: 'peace-lily', name: 'Peace Lily', type: 'indoor', icon: '🪴', care: 'Low to medium light, weekly watering' },
  { id: 'monstera', name: 'Monstera', type: 'indoor', icon: '🌱', care: 'Bright indirect light, weekly watering' },
  { id: 'pothos', name: 'Pothos', type: 'indoor', icon: '🍃', care: 'Low light, water when dry' },
  { id: 'zz-plant', name: 'ZZ Plant', type: 'indoor', icon: '🌵', care: 'Low light, water monthly' },
  { id: 'fern', name: 'Fern', type: 'indoor', icon: '🌿', care: 'Humid environment, regular misting' },
  { id: 'succulents', name: 'Succulents', type: 'indoor', icon: '🌵', care: 'Bright light, water sparingly' },
  { id: 'cactus', name: 'Cactus', type: 'indoor', icon: '🌵', care: 'Full sun, water monthly' },
  { id: 'bonsai', name: 'Bonsai', type: 'indoor', icon: '🎋', care: 'Bright light, regular pruning' },
  { id: 'air-plants', name: 'Air Plants', type: 'indoor', icon: '🌿', care: 'Mist weekly, bright indirect light' },
  { id: 'aloe', name: 'Aloe', type: 'indoor', icon: '🌵', care: 'Bright light, water sparingly' },
  { id: 'spider-plant', name: 'Spider Plant', type: 'indoor', icon: '🕷️', care: 'Easy care, bright indirect light' },
  { id: 'rubber-plant', name: 'Rubber Plant', type: 'indoor', icon: '🌿', care: 'Bright indirect light, weekly watering' },
  { id: 'fiddle-leaf-fig', name: 'Fiddle Leaf Fig', type: 'indoor', icon: '🌳', care: 'Bright light, weekly watering' },
  { id: 'calathea', name: 'Calathea', type: 'indoor', icon: '🍃', care: 'Medium light, keep moist' },
  { id: 'philodendron', name: 'Philodendron', type: 'indoor', icon: '🌿', care: 'Low to bright light, weekly watering' }
];

export const OCCASIONS = [
  'Birthday', 'Anniversary', 'Wedding', 'Sympathy', 'Get Well', 
  'Just Because', 'Congratulations', 'Thank You', 'House Warming', 'Office Decor'
];

// Plant care tips
export const PLANT_CARE_TIPS = {
  'snake-plant': 'Perfect for beginners! Water every 2-3 weeks, tolerates low light.',
  'peace-lily': 'Beautiful white flowers. Keep soil moist, loves indirect light.',
  'monstera': 'Iconic split leaves. Provide a moss pole for climbing.',
  'pothos': 'Trailing vine, great for hanging baskets. Very forgiving.',
  'zz-plant': 'Almost unkillable! Drought tolerant, low light champion.',
  'fern': 'Loves humidity. Mist regularly, keep soil consistently moist.',
  'succulents': 'Water deeply but infrequently. Needs bright light.',
  'cactus': 'Desert plant. Full sun, water very sparingly.',
  'bonsai': 'Miniature tree. Requires pruning and shaping.',
  'air-plants': 'No soil needed! Mist 2-3 times per week.',
  'aloe': 'Sun-loving succulent. Water deeply but infrequently.',
  'spider-plant': 'Produces baby plants. Easy to care for.',
  'rubber-plant': 'Large glossy leaves. Wipe leaves to keep clean.',
  'fiddle-leaf-fig': 'Trendy plant. Needs consistent care.',
  'calathea': 'Prayer plant. Loves humidity and distilled water.',
  'philodendron': 'Heart-shaped leaves. Very adaptable.'
};