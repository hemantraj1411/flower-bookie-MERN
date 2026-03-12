import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlantCard from '../components/PlantCard';
import { productAPI } from '../services/api';
import { 
  FaFilter, 
  FaTimes, 
  FaLeaf, 
  FaTint, 
  FaShieldAlt, 
  FaPaw,
  FaWater,
  FaSun,
  FaBook,
  FaSeedling
} from 'react-icons/fa';
import { GiPlantRoots, GiFlowerPot } from 'react-icons/gi'; // Removed GiFertilizer
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const IndoorPlants = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    careLevel: '',
    waterNeeds: '',
    airPurifying: false,
    petFriendly: false,
    sort: 'newest',
    inStock: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  const careLevels = ['easy', 'moderate', 'difficult'];
  const waterOptions = ['weekly', 'bi-weekly', 'monthly'];

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters = { ...filters };
    
    params.forEach((value, key) => {
      if (key === 'airPurifying' || key === 'petFriendly' || key === 'inStock') {
        newFilters[key] = value === 'true';
      } else if (key in newFilters) {
        newFilters[key] = value;
      }
    });
    
    setFilters(newFilters);
    fetchPlants(newFilters, pagination.page);
  }, [location.search]);

  // Fetch plants with filters
  const fetchPlants = async (filterParams, page = 1) => {
    try {
      setLoading(true);
      console.log('🌱 Fetching plants with params:', { ...filterParams, page });
      
      const params = {
        page,
        limit: 12,
        ...filterParams
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await productAPI.getPlants(params);
      console.log('✅ Plants fetched:', response);
      
      // IMPORTANT: Check the response structure
      let plantsData = [];
      let paginationData = { page: 1, pages: 1, total: 0 };
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // If response is directly an array
          plantsData = response.data;
        } else if (response.data.plants && Array.isArray(response.data.plants)) {
          // If response has plants property (like your API)
          plantsData = response.data.plants;
          paginationData = {
            page: response.data.page || 1,
            pages: response.data.pages || 1,
            total: response.data.total || plantsData.length
          };
        } else if (response.data.products && Array.isArray(response.data.products)) {
          // If response has products property
          plantsData = response.data.products;
          paginationData = {
            page: response.data.page || 1,
            pages: response.data.pages || 1,
            total: response.data.total || plantsData.length
          };
        }
      }
      
      console.log('🌿 Processed plants data:', plantsData);
      console.log('📊 Pagination:', paginationData);
      
      setPlants(plantsData);
      setPagination(paginationData);
      
      // Extract unique categories from plants
      const uniqueCategories = [...new Set(plantsData.map(p => p.category?.name).filter(Boolean))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('❌ Error fetching plants:', error);
      toast.error('Failed to fetch plants');
      setPlants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value.toString());
      }
    });
    navigate(`/plants?${params.toString()}`);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      careLevel: '',
      waterNeeds: '',
      airPurifying: false,
      petFriendly: false,
      sort: 'newest',
      inStock: false
    });
    navigate('/plants');
    setShowFilters(false);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    const params = new URLSearchParams(location.search);
    params.set('page', newPage.toString());
    navigate(`/plants?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center">
          <GiPlantRoots className="mr-3 text-green-600" />
          Indoor Plants
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <FaFilter className="mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Plant Guidance Banner */}
      <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between p-6 text-white">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <GiPlantRoots className="text-3xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">New to Plant Care?</h2>
              <p className="text-white/90">Get expert guidance on watering, light, and more</p>
            </div>
          </div>
          <Link
            to="/plant-care-guide"
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center"
          >
            <FaBook className="mr-2" /> View Complete Guide
          </Link>
        </div>
      </div>

      {/* Quick Care Tips - FIXED: Replaced GiFertilizer with FaSeedling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: FaWater, label: 'Watering Guide', color: 'bg-blue-100 text-blue-600', link: '/plant-care-guide#watering-guide' },
          { icon: FaSun, label: 'Light Requirements', color: 'bg-yellow-100 text-yellow-600', link: '/plant-care-guide#light-requirements' },
          { icon: GiFlowerPot, label: 'Soil & Potting', color: 'bg-amber-100 text-amber-600', link: '/plant-care-guide#soil-potted' },
          { icon: FaSeedling, label: 'Fertilizing', color: 'bg-green-100 text-green-600', link: '/plant-care-guide#fertilizing' } // Changed GiFertilizer to FaSeedling
        ].map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className={`${item.color} rounded-xl p-3 text-center hover:shadow-md transition-shadow`}
          >
            <item.icon className="text-xl mx-auto mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price (₹)
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price (₹)
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Care Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaLeaf className="mr-2 text-green-600" /> Care Level
              </label>
              <select
                name="careLevel"
                value={filters.careLevel}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Levels</option>
                {careLevels.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Water Needs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaTint className="mr-2 text-blue-600" /> Water Needs
              </label>
              <select
                name="waterNeeds"
                value={filters.waterNeeds}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All</option>
                {waterOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="newest">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="flex flex-wrap gap-6 mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="airPurifying"
                checked={filters.airPurifying}
                onChange={handleFilterChange}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="flex items-center text-gray-700">
                <FaShieldAlt className="mr-1 text-teal-600" /> Air Purifying
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="petFriendly"
                checked={filters.petFriendly}
                onChange={handleFilterChange}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="flex items-center text-gray-700">
                <FaPaw className="mr-1 text-purple-600" /> Pet Friendly
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="inStock"
                checked={filters.inStock}
                onChange={handleFilterChange}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">In Stock Only</span>
            </label>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-gray-600 mb-4">
        Showing {plants.length} of {pagination.total} plants
      </p>

      {/* Products Grid - USING PLANT CARD */}
      {plants.length === 0 ? (
        <div className="text-center py-12">
          <GiPlantRoots className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Plants Found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plants.map((plant) => (
            <PlantCard key={plant._id} plant={plant} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default IndoorPlants;