import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { categoryAPI } from '../../services/api';
import { FaCloudUploadAlt, FaTimes, FaLeaf, FaSun, FaTint, FaPaw, FaShieldAlt } from 'react-icons/fa';
import { GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';

const CreatePlant = () => {
  const navigate = useNavigate();
  const { createPlant, loading } = useAdmin(); // Get loading from useAdmin
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false); // Add local submitting state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    oldPrice: '',
    category: '',
    stock: '',
    images: [],
    isFeatured: false,
    isBestSeller: false,
    badge: '',
    tags: [],
    careInstructions: '',
    // Plant-specific fields
    careLevel: 'easy',
    lightNeeds: 'medium',
    waterNeeds: 'weekly',
    petFriendly: false,
    airPurifying: false
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadError, setUploadError] = useState('');

  const careLevels = ['easy', 'moderate', 'expert'];
  const lightOptions = ['low', 'medium', 'bright indirect', 'full sun'];
  const waterOptions = ['weekly', 'bi-weekly', 'monthly', 'sparingly'];

  // Fallback plant categories in case API fails
  const fallbackPlantCategories = [
    { _id: 'snake-plant', name: 'Snake Plant' },
    { _id: 'peace-lily', name: 'Peace Lily' },
    { _id: 'monstera', name: 'Monstera' },
    { _id: 'succulents', name: 'Succulents' },
    { _id: 'cactus', name: 'Cactus' },
    { _id: 'fern', name: 'Fern' },
    { _id: 'pothos', name: 'Pothos' },
    { _id: 'zz-plant', name: 'ZZ Plant' },
    { _id: 'bonsai', name: 'Bonsai' },
    { _id: 'aloe', name: 'Aloe' },
    { _id: 'spider-plant', name: 'Spider Plant' },
    { _id: 'rubber-plant', name: 'Rubber Plant' },
    { _id: 'fiddle-leaf-fig', name: 'Fiddle Leaf Fig' },
    { _id: 'calathea', name: 'Calathea' },
    { _id: 'philodendron', name: 'Philodendron' }
  ];

  useEffect(() => {
    fetchPlantCategories();
  }, []);

  const fetchPlantCategories = async () => {
    try {
      setLoadingCategories(true);
      
      let categoriesData = [];
      
      try {
        // Try to fetch from API first
        const response = await categoryAPI.getPlants();
        console.log('API Response:', response);
        categoriesData = response.data;
        console.log('✅ Plant categories loaded from API:', categoriesData);
      } catch (apiError) {
        console.error('API Error:', apiError);
        console.log('⚠️ Using fallback plant categories');
        // Use fallback categories if API fails
        categoriesData = fallbackPlantCategories;
      }
      
      // If API returned empty array, use fallback
      if (!categoriesData || categoriesData.length === 0) {
        console.log('⚠️ API returned empty, using fallback categories');
        categoriesData = fallbackPlantCategories;
      }
      
      setCategories(categoriesData);
      
      // Set default category if available
      if (categoriesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: categoriesData[0]._id
        }));
      }
    } catch (error) {
      console.error('❌ Error in fetchPlantCategories:', error);
      // Use fallback on any error
      setCategories(fallbackPlantCategories);
      if (fallbackPlantCategories.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: fallbackPlantCategories[0]._id
        }));
      }
      toast.error('Using default categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plant categories...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need administrator privileges to create plants.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-3"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setUploadError('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setUploadError('Please select only image files');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setUploadError('Images must be less than 5MB each');
      return;
    }

    setFormData({ ...formData, images: files });
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    setUploadError('');
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
    
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Plant name is required');
      return;
    }
    if (!formData.price) {
      toast.error('Price is required');
      return;
    }
    if (!formData.stock) {
      toast.error('Stock quantity is required');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    if (!formData.shortDescription.trim()) {
      toast.error('Short description is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Full description is required');
      return;
    }

    setSubmitting(true); // Use local submitting state

    const plantData = new FormData();
    
    // IMPORTANT: Set type to 'indoor' for plants
    plantData.append('type', 'indoor');
    
    // Basic info
    plantData.append('name', formData.name);
    plantData.append('description', formData.description);
    plantData.append('shortDescription', formData.shortDescription);
    plantData.append('price', formData.price);
    plantData.append('oldPrice', formData.oldPrice || '0');
    plantData.append('category', formData.category);
    plantData.append('stock', formData.stock);
    plantData.append('isFeatured', formData.isFeatured ? 'true' : 'false');
    plantData.append('isBestSeller', formData.isBestSeller ? 'true' : 'false');
    plantData.append('badge', formData.badge || '');
    plantData.append('careInstructions', formData.careInstructions || '');
    
    // Plant-specific fields
    plantData.append('careLevel', formData.careLevel);
    plantData.append('lightNeeds', formData.lightNeeds);
    plantData.append('waterNeeds', formData.waterNeeds);
    plantData.append('petFriendly', formData.petFriendly ? 'true' : 'false');
    plantData.append('airPurifying', formData.airPurifying ? 'true' : 'false');
    
    // Handle tags - send as JSON string
    plantData.append('tags', JSON.stringify(formData.tags));
    
    // Append images (files)
    formData.images.forEach((image) => {
      plantData.append('images', image);
      console.log(`📸 Appending image:`, image.name);
    });

    // Log FormData for debugging
    console.log('📦 Submitting plant with data:');
    for (let pair of plantData.entries()) {
      if (pair[0] === 'images') {
        console.log(pair[0], pair[1].name);
      } else {
        console.log(pair[0], pair[1]);
      }
    }

    try {
      const success = await createPlant(plantData);
      if (success) {
        // Clean up image previews
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        toast.success('Plant created successfully!');
        navigate('/admin/plants');
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error('Failed to create plant');
    } finally {
      setSubmitting(false); // Reset submitting state
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-800 mb-8 flex items-center">
        <GiPlantRoots className="mr-3 text-green-600" />
        Add New Plant
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{uploadError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Snake Plant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <input
                type="text"
                name="shortDescription"
                required
                value={formData.shortDescription}
                onChange={handleChange}
                maxLength="200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Brief description (max 200 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description *
              </label>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Detailed plant description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="499"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Old Price (₹)
                </label>
                <input
                  type="number"
                  name="oldPrice"
                  min="0"
                  step="0.01"
                  value={formData.oldPrice}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="699"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge
                </label>
                <select
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">None</option>
                  <option value="New">New</option>
                  <option value="Sale">Sale</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a plant category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {categories.length} plant categories available
              </p>
            </div>

            {/* Plant Care Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaLeaf className="mr-2 text-green-600" /> Care Level
                </label>
                <select
                  name="careLevel"
                  value={formData.careLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {careLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaSun className="mr-2 text-yellow-600" /> Light Needs
                </label>
                <select
                  name="lightNeeds"
                  value={formData.lightNeeds}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {lightOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaTint className="mr-2 text-blue-600" /> Water Needs
                </label>
                <select
                  name="waterNeeds"
                  value={formData.waterNeeds}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {waterOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="air purifying, easy care, pet friendly"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="petFriendly"
                  checked={formData.petFriendly}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 flex items-center">
                  <FaPaw className="mr-2 text-purple-600" /> Pet Friendly
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="airPurifying"
                  checked={formData.airPurifying}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-gray-700 flex items-center">
                  <FaShieldAlt className="mr-2 text-teal-600" /> Air Purifying
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Care Instructions
              </label>
              <textarea
                name="careInstructions"
                rows="3"
                value={formData.careInstructions}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="How to care for this plant..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Images * (Max 5MB each)
              </label>
              
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Selected Images:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  {imagePreviews.length > 0 ? 'Add more images' : 'Click to upload images'}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supported formats: JPG, PNG, GIF, WEBP (Max 5MB each)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  multiple
                />
                <label
                  htmlFor="image-upload"
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700"
                >
                  Select Images
                </label>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Featured Plant</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Best Seller</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/plants')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || formData.images.length === 0 || !formData.category} // Use submitting instead of loading
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <GiPlantRoots className="mr-2" />
            {submitting ? 'Creating...' : 'Create Plant'} {/* Use submitting */}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePlant;