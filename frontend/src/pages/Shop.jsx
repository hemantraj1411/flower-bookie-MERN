import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import FlowerCard from '../components/FlowerCard';
import PlantCard from '../components/PlantCard';
import Loader from '../components/Loader';
import { FaFilter, FaSearch, FaLeaf, FaTimes, FaChevronDown, FaChevronUp, FaSlidersH } from 'react-icons/fa';
import { GiPlantRoots, GiFlowerEmblem } from 'react-icons/gi';
import { PRODUCT_CATEGORIES, OCCASIONS } from '../utils/constants';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';
// Removed framer-motion import

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [flowers, setFlowers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    occasion: searchParams.get('occasion') || '',
    priceRange: '',
    sortBy: 'newest',
    search: searchParams.get('search') || ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    quickFilter: true,
    flowerCategories: true,
    plantCategories: true,
    occasions: true,
    priceRange: true
  });

  // Separate categories by type
  const flowerCategories = PRODUCT_CATEGORIES.filter(cat => cat.type === 'flower');
  const plantCategories = PRODUCT_CATEGORIES.filter(cat => cat.type === 'indoor');

  // Price ranges in INR
  const priceRanges = [
    { label: 'Under ₹500', value: '0-500' },
    { label: '₹500 - ₹2,000', value: '500-2000' },
    { label: '₹2,000 - ₹5,000', value: '2000-5000' },
    { label: 'Over ₹5,000', value: '5000-99999' }
  ];

  useEffect(() => {
    fetchProducts();
  }, [filters.category, filters.occasion, filters.priceRange, filters.sortBy, filters.search, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      console.log('📦 Fetching products - Active tab:', activeTab);
      
      const params = {};
      
      if (filters.category) params.category = filters.category;
      if (filters.occasion) params.occasion = filters.occasion;
      if (filters.search) params.keyword = filters.search;
      
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-');
        params.minPrice = min;
        params.maxPrice = max;
      }
      
      if (filters.sortBy) {
        switch(filters.sortBy) {
          case 'price-low': params.sort = 'price'; break;
          case 'price-high': params.sort = '-price'; break;
          case 'popular': params.sort = '-rating'; break;
          case 'rating': params.sort = '-rating'; break;
          default: params.sort = '-createdAt';
        }
      }
      
      console.log('🔍 Fetching with params:', params);
      
      const response = await productAPI.getAll(params);
      console.log('✅ Products fetched:', response.data);
      
      // Handle different response structures
      let allProducts = [];
      if (response.data && response.data.products) {
        allProducts = response.data.products;
        setTotalProducts(response.data.total || allProducts.length);
      } else if (Array.isArray(response.data)) {
        allProducts = response.data;
        setTotalProducts(allProducts.length);
      } else if (response.data && typeof response.data === 'object') {
        const values = Object.values(response.data);
        if (values.length > 0 && values.every(val => typeof val === 'object')) {
          allProducts = values;
          setTotalProducts(allProducts.length);
        }
      }
      
      console.log('📊 Total products fetched:', allProducts.length);
      
      // Ensure each product has a type
      allProducts = allProducts.map(product => {
        if (!product.type) {
          // Try to determine type from category
          const categoryName = product.category?.name || product.category;
          if (categoryName) {
            const isPlant = plantCategories.some(cat => 
              cat.name.toLowerCase() === (typeof categoryName === 'string' ? categoryName.toLowerCase() : '')
            );
            product.type = isPlant ? 'indoor' : 'flower';
          } else {
            product.type = 'flower';
          }
        }
        return product;
      });
      
      setProducts(allProducts);
      
      // Separate flowers and plants based on type
      const flowerList = allProducts.filter(p => p.type === 'flower');
      const plantList = allProducts.filter(p => p.type === 'indoor');
      
      console.log('🌸 Flowers count:', flowerList.length);
      console.log('🌿 Plants count:', plantList.length);
      
      setFlowers(flowerList);
      setPlants(plantList);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast.error(error.response?.data?.message || 'Failed to load products');
      setProducts([]);
      setFlowers([]);
      setPlants([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, category: '' }));
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    setSearchParams(params);
    
    // Close mobile filters after selection
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  };

  const handleFilterChange = (key, value) => {
    console.log(`🔧 Filter changed: ${key} = ${value}`);
    setFilters(prev => ({ ...prev, [key]: value }));
    
    if (key === 'category' || key === 'occasion' || key === 'search') {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      setSearchParams(params);
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      occasion: '',
      priceRange: '',
      sortBy: 'newest',
      search: ''
    });
    setSearchParams({});
    toast.success('Filters cleared');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.occasion) count++;
    if (filters.priceRange) count++;
    if (filters.search) count++;
    return count;
  };

  // Get current display products based on active tab
  const getDisplayProducts = () => {
    let displayProducts = [];
    
    if (activeTab === 'flowers') {
      displayProducts = flowers;
    } else if (activeTab === 'plants') {
      displayProducts = plants;
    } else {
      displayProducts = products;
    }
    
    // Apply category filter if selected
    if (filters.category && displayProducts.length > 0) {
      console.log(`🔍 Filtering by category: "${filters.category}"`);
      
      displayProducts = displayProducts.filter(item => {
        // Get the category value from the item
        let itemCategory = null;
        
        if (typeof item.category === 'string') {
          itemCategory = item.category;
        } else if (item.category && typeof item.category === 'object') {
          itemCategory = item.category.name || item.category._id;
        }
        
        // Case-insensitive comparison
        const match = itemCategory && 
          itemCategory.toLowerCase() === filters.category.toLowerCase();
        
        return match;
      });
      
      console.log(`📊 After filtering: ${displayProducts.length} products`);
    }
    
    return displayProducts;
  };

  const displayProducts = getDisplayProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs - Responsive */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-green-600 text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-center">
            Shop Our Collection
          </h1>
          
          {/* Category Tabs - Scrollable on Mobile */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:pb-0 md:mx-0 md:px-0">
            <div className="flex md:justify-center space-x-3 min-w-max md:min-w-0">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold transition-all transform hover:scale-105 text-sm md:text-base whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-800 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                All Items ({products.length})
              </button>
              <button
                onClick={() => handleTabChange('flowers')}
                className={`px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center whitespace-nowrap text-sm md:text-base ${
                  activeTab === 'flowers'
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <GiFlowerEmblem className="mr-1 md:mr-2" /> Flowers ({flowers.length})
              </button>
              <button
                onClick={() => handleTabChange('plants')}
                className={`px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center whitespace-nowrap text-sm md:text-base ${
                  activeTab === 'plants'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <GiPlantRoots className="mr-1 md:mr-2" /> Plants ({plants.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Search Bar - Responsive */}
        <div className="mb-4 md:mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'flowers' ? 'flowers' : activeTab === 'plants' ? 'plants' : 'flowers or plants'}...`}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 md:px-6 py-3 md:py-4 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-md text-sm md:text-base"
            />
            <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg md:text-xl" />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-sm md:text-base" />
              </button>
            )}
          </div>
        </div>

        {/* Active Tab Indicator - Responsive */}
        <div className="mb-4 md:mb-6 text-center">
          <span className={`inline-block px-4 md:px-6 py-1 md:py-2 rounded-full text-xs md:text-sm ${
            activeTab === 'flowers' ? 'bg-pink-100 text-pink-700' :
            activeTab === 'plants' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {activeTab === 'all' && `Showing All Items (${displayProducts.length})`}
            {activeTab === 'flowers' && `Showing Flowers Only (${displayProducts.length})`}
            {activeTab === 'plants' && `Showing Plants Only (${displayProducts.length})`}
          </span>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <FaSlidersH className="text-pink-600 text-lg" />
              <span className="font-medium">Filters & Sort</span>
            </div>
            <div className="flex items-center space-x-2">
              {getActiveFiltersCount() > 0 && (
                <span className="bg-pink-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {getActiveFiltersCount()}
                </span>
              )}
              <FaChevronDown className={`text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Filters Sidebar - Responsive (removed AnimatePresence and motion) */}
          {(showFilters || window.innerWidth >= 768) && (
            <div className="md:w-72">
              <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 md:sticky md:top-24">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h3 className="font-bold text-lg md:text-xl">Filters</h3>
                  <div className="flex items-center space-x-3">
                    {getActiveFiltersCount() > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                      >
                        Clear All ({getActiveFiltersCount()})
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="md:hidden text-gray-500 hover:text-gray-700"
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                </div>

                {/* Quick Filter Section */}
                <div className="mb-4 border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleSection('quickFilter')}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                  >
                    <span className="text-sm md:text-base">Quick Filter</span>
                    {expandedSections.quickFilter ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                  </button>
                  {expandedSections.quickFilter && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleTabChange('all')}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm md:text-base ${
                          activeTab === 'all' ? 'bg-pink-100 text-pink-700 font-medium' : 'hover:bg-gray-100'
                        }`}
                      >
                        All Products
                      </button>
                      <button
                        onClick={() => handleTabChange('flowers')}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm md:text-base ${
                          activeTab === 'flowers' ? 'bg-pink-100 text-pink-700 font-medium' : 'hover:bg-gray-100'
                        }`}
                      >
                        🌸 Flowers Only
                      </button>
                      <button
                        onClick={() => handleTabChange('plants')}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm md:text-base ${
                          activeTab === 'plants' ? 'bg-green-100 text-green-700 font-medium' : 'hover:bg-gray-100'
                        }`}
                      >
                        <GiPlantRoots className="inline mr-1" /> Plants Only
                      </button>
                    </div>
                  )}
                </div>

                {/* Flower Categories */}
                {(activeTab === 'all' || activeTab === 'flowers') && (
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <button
                      onClick={() => toggleSection('flowerCategories')}
                      className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                    >
                      <span className="flex items-center text-sm md:text-base">
                        <GiFlowerEmblem className="mr-1 text-pink-500" /> Flower Categories
                      </span>
                      {expandedSections.flowerCategories ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.flowerCategories && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {flowerCategories.map(cat => (
                          <label key={cat.id} className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="category"
                              value={cat.name}
                              checked={filters.category === cat.name}
                              onChange={(e) => handleFilterChange('category', e.target.value)}
                              className="text-pink-600 focus:ring-pink-500"
                            />
                            <span className="text-gray-600 group-hover:text-pink-600 transition-colors text-xs md:text-sm">
                              {cat.icon} {cat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Plant Categories */}
                {(activeTab === 'all' || activeTab === 'plants') && (
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <button
                      onClick={() => toggleSection('plantCategories')}
                      className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                    >
                      <span className="flex items-center text-sm md:text-base">
                        <GiPlantRoots className="mr-1 text-green-600" /> Plant Categories
                      </span>
                      {expandedSections.plantCategories ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.plantCategories && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {plantCategories.map(cat => (
                          <label key={cat.id} className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="category"
                              value={cat.name}
                              checked={filters.category === cat.name}
                              onChange={(e) => handleFilterChange('category', e.target.value)}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <span className="text-gray-600 group-hover:text-green-600 transition-colors text-xs md:text-sm">
                              {cat.icon} {cat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Occasions */}
                {(activeTab === 'all' || activeTab === 'flowers') && (
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <button
                      onClick={() => toggleSection('occasions')}
                      className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                    >
                      <span className="text-sm md:text-base">Occasions</span>
                      {expandedSections.occasions ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                    </button>
                    {expandedSections.occasions && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {OCCASIONS.map(occ => (
                          <label key={occ} className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="occasion"
                              value={occ}
                              checked={filters.occasion === occ}
                              onChange={(e) => handleFilterChange('occasion', e.target.value)}
                              className="text-pink-600 focus:ring-pink-500"
                            />
                            <span className="text-gray-600 group-hover:text-pink-600 transition-colors text-xs md:text-sm">
                              {occ}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-4 border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleSection('priceRange')}
                    className="flex items-center justify-between w-full text-left font-semibold text-gray-700 mb-3"
                  >
                    <span className="text-sm md:text-base">Price Range</span>
                    {expandedSections.priceRange ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                  </button>
                  {expandedSections.priceRange && (
                    <div className="space-y-2">
                      {priceRanges.map(range => (
                        <label key={range.value} className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="priceRange"
                            value={range.value}
                            checked={filters.priceRange === range.value}
                            onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-gray-600 group-hover:text-pink-600 transition-colors text-xs md:text-sm">
                            {range.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort By */}
                <div className="mb-4">
                  <label className="block font-semibold text-gray-700 mb-3 text-sm md:text-base">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-xs md:text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {/* Apply Filters Button - Mobile Only */}
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full md:hidden btn-primary py-3 mt-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Count - Responsive */}
            <div className="mb-4 md:mb-6 flex flex-wrap justify-between items-center">
              <p className="text-sm md:text-base text-gray-600">
                Showing <span className={`font-bold ${
                  activeTab === 'flowers' ? 'text-pink-600' :
                  activeTab === 'plants' ? 'text-green-600' :
                  'text-pink-600'
                }`}>{displayProducts.length}</span> results
                {totalProducts > 0 && <span className="text-gray-400 text-xs md:text-sm"> of {totalProducts} total</span>}
              </p>
              {getActiveFiltersCount() > 0 && (
                <p className="text-xs md:text-sm text-gray-500 bg-gray-100 px-2 md:px-3 py-1 rounded-full">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} active
                </p>
              )}
            </div>

            {loading ? (
              <Loader />
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12 md:py-16 bg-white rounded-lg shadow">
                {activeTab === 'flowers' ? (
                  <GiFlowerEmblem className="text-5xl md:text-6xl text-pink-300 mx-auto mb-4" />
                ) : activeTab === 'plants' ? (
                  <GiPlantRoots className="text-5xl md:text-6xl text-green-300 mx-auto mb-4" />
                ) : (
                  <GiFlowerEmblem className="text-5xl md:text-6xl text-pink-300 mx-auto mb-4" />
                )}
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md mx-auto px-4">
                  {getActiveFiltersCount() > 0 
                    ? `No products match your selected filters. Try adjusting your criteria.`
                    : activeTab === 'flowers' 
                      ? "No flowers available at the moment. Please check back later."
                      : activeTab === 'plants'
                        ? "No plants available at the moment. Please check back later."
                        : "No products available at the moment. Please check back later."}
                </p>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="btn-primary px-6 py-2 md:py-3 text-sm md:text-base"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {displayProducts.map((product) => (
                  <div key={product._id}>
                    {product.type === 'indoor' ? (
                      <PlantCard plant={product} />
                    ) : (
                      <FlowerCard flower={product} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;