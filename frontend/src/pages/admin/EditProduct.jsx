import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { productAPI, categoryAPI } from '../../services/api';
import { FaCloudUploadAlt, FaTimes, FaLeaf, FaSun, FaTint, FaPaw, FaShieldAlt } from 'react-icons/fa';
import { GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';

const EditPlant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updatePlant, loading } = useAdmin();
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
    careLevel: 'easy',
    lightNeeds: 'medium',
    waterNeeds: 'weekly',
    petFriendly: false,
    airPurifying: false
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [uploadError, setUploadError] = useState('');

  const careLevels = ['easy', 'moderate', 'expert'];
  const lightOptions = ['low', 'medium', 'bright indirect', 'full sun'];
  const waterOptions = ['weekly', 'bi-weekly', 'monthly', 'sparingly'];

  const fallbackPlantCategories = [
    { _id: 'snake-plant', name: 'Snake Plant' },
    { _id: 'peace-lily', name: 'Peace Lily' },
    { _id: 'monstera', name: 'Monstera' },
    { _id: 'succulents', name: 'Succulents' },
    { _id: 'cactus', name: 'Cactus' },
    { _id: 'fern', name: 'Fern' },
    { _id: 'pothos', name: 'Pothos' },
    { _id: 'zz-plant', name: 'ZZ Plant' },
    { _id: 'bonsai', name: 'Bonsai' }
  ];

  useEffect(() => {
    fetchPlant();
    fetchPlantCategories();
  }, [id]);

  const fetchPlant = async () => {
    try {
      const response = await productAPI.getById(id);
      const plant = response.data.product || response.data;
      
      setFormData({
        name: plant.name || '',
        description: plant.description || '',
        shortDescription: plant.shortDescription || '',
        price: plant.price || '',
        oldPrice: plant.oldPrice || '',
        category: plant.category?._id || plant.category || '',
        stock: plant.stock || '',
        images: [],
        isFeatured: plant.isFeatured || false,
        isBestSeller: plant.isBestSeller || false,
        badge: plant.badge || '',
        tags: plant.tags || [],
        careInstructions: plant.careInstructions || '',
        careLevel: plant.careLevel || 'easy',
        lightNeeds: plant.lightNeeds || 'medium',
        waterNeeds: plant.waterNeeds || 'weekly',
        petFriendly: plant.petFriendly || false,
        airPurifying: plant.airPurifying || false
      });
      
      setCurrentImages(plant.images || []);
    } catch (error) {
      console.error('Error fetching plant:', error);
      toast.error('Failed to load plant');
    }
  };

  const fetchPlantCategories = async () => {
    try {
      setLoadingCategories(true);
      let categoriesData = [];
      
      try {
        const response = await categoryAPI.getPlants();
        categoriesData = response.data;
      } catch (error) {
        console.log('Using fallback categories');
        categoriesData = fallbackPlantCategories;
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <button onClick={() => navigate('/')} className="btn-primary px-6 py-3">
            Go Home
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

  const removeCurrentImage = (index) => {
    const updatedImages = [...currentImages];
    updatedImages.splice(index, 1);
    setCurrentImages(updatedImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const plantData = new FormData();
    
    plantData.append('name', formData.name);
    plantData.append('description', formData.description);
    plantData.append('shortDescription', formData.shortDescription);
    plantData.append('price', formData.price);
    plantData.append('oldPrice', formData.oldPrice || '0');
    plantData.append('category', formData.category);
    plantData.append('stock', formData.stock);
    plantData.append('isFeatured', formData.isFeatured);
    plantData.append('isBestSeller', formData.isBestSeller);
    plantData.append('badge', formData.badge || '');
    plantData.append('careInstructions', formData.careInstructions || '');
    
    plantData.append('careLevel', formData.careLevel);
    plantData.append('lightNeeds', formData.lightNeeds);
    plantData.append('waterNeeds', formData.waterNeeds);
    plantData.append('petFriendly', formData.petFriendly);
    plantData.append('airPurifying', formData.airPurifying);
    plantData.append('type', 'indoor');
    
    plantData.append('tags', JSON.stringify(formData.tags));
    
    if (currentImages.length > 0) {
      plantData.append('existingImages', JSON.stringify(currentImages));
    }
    
    formData.images.forEach((image) => {
      plantData.append('images', image);
    });

    const success = await updatePlant(id, plantData);
    if (success) {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      toast.success('Plant updated successfully!');
      navigate('/admin/plants');
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-800 mb-8 flex items-center">
        <GiPlantRoots className="mr-3 text-green-600" />
        Edit Plant
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                />
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
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Images */}
            {currentImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Images
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {currentImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.url || `/uploads/${img.publicId}`}
                        alt={`Current ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeCurrentImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Images
              </label>
              
              {imagePreviews.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  multiple
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-green-600 hover:text-green-700"
                >
                  <FaCloudUploadAlt className="text-3xl mx-auto mb-2" />
                  <span className="text-sm">Click to upload images</span>
                </label>
              </div>
            </div>

            {/* Plant Care Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Care Level
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Light Needs
                </label>
                <select
                  name="lightNeeds"
                  value={formData.lightNeeds}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {lightOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Needs
                </label>
                <select
                  name="waterNeeds"
                  value={formData.waterNeeds}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {waterOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="air purifying, easy care"
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
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="flex items-center">
                  <FaPaw className="mr-2 text-purple-600" /> Pet Friendly
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="airPurifying"
                  checked={formData.airPurifying}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="flex items-center">
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
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span>Featured Plant</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span>Best Seller</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/plants')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            <GiPlantRoots className="mr-2" />
            {loading ? 'Updating...' : 'Update Plant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPlant;