import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { FaCloudUploadAlt, FaTimes, FaRupeeSign, FaPlus } from 'react-icons/fa';
import { GiFlowerEmblem } from 'react-icons/gi';
import toast from 'react-hot-toast';

const CreateProduct = () => {
  const navigate = useNavigate();
  const { createProduct } = useAdmin();
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    oldPrice: '',
    category: '',
    occasion: ['Birthday'],
    stock: '',
    images: [],
    isFeatured: false,
    isBestSeller: false,
    badge: '',
    tags: [],
    careInstructions: '',
    type: 'flower'
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadError, setUploadError] = useState('');

  const occasions = [
    'Birthday', 'Anniversary', 'Wedding', 'Sympathy', 'Get Well', 
    'Just Because', 'Congratulations', 'Thank You'
  ];

  const badges = ['New', 'Sale', 'Best Seller', 'Limited', 'Seasonal', ''];

  // Fixed flower categories with proper IDs
  const flowerCategories = [
    { _id: 'roses', name: 'Roses' },
    { _id: 'tulips', name: 'Tulips' },
    { _id: 'lilies', name: 'Lilies' },
    { _id: 'orchids', name: 'Orchids' },
    { _id: 'sunflowers', name: 'Sunflowers' },
    { _id: 'daisies', name: 'Daisies' },
    { _id: 'carnations', name: 'Carnations' },
    { _id: 'peonies', name: 'Peonies' },
    { _id: 'hydrangeas', name: 'Hydrangeas' },
    { _id: 'mixed', name: 'Mixed Bouquets' }
  ];

  useEffect(() => {
    setCategories(flowerCategories);
    if (flowerCategories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: flowerCategories[0]._id
      }));
    }
  }, []);

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    // Create a new category with a URL-friendly ID
    const newId = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    const newCategory = { _id: newId, name: newCategoryName };
    
    setCategories(prev => [...prev, newCategory]);
    setFormData(prev => ({ ...prev, category: newId }));
    setNewCategoryName('');
    setShowNewCategoryInput(false);
    
    toast.success(`Category "${newCategoryName}" added`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin panel.</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-6 py-3"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need administrator privileges.</p>
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

  const handleOccasionChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      occasion: selected
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Flower name is required');
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

    setSubmitting(true);

    const productData = new FormData();
    
    productData.append('type', 'flower');
    productData.append('name', formData.name);
    productData.append('description', formData.description || '');
    productData.append('shortDescription', formData.shortDescription || '');
    productData.append('price', formData.price);
    productData.append('oldPrice', formData.oldPrice || '0');
    productData.append('category', formData.category);
    productData.append('stock', formData.stock);
    productData.append('isFeatured', formData.isFeatured ? 'true' : 'false');
    productData.append('isBestSeller', formData.isBestSeller ? 'true' : 'false');
    productData.append('badge', formData.badge || '');
    productData.append('careInstructions', formData.careInstructions || '');
    
    if (formData.occasion && formData.occasion.length > 0) {
      productData.append('occasion', JSON.stringify(formData.occasion));
    }
    
    if (formData.tags && formData.tags.length > 0) {
      productData.append('tags', JSON.stringify(formData.tags));
    }
    
    formData.images.forEach((image) => {
      productData.append('images', image);
    });

    try {
      const success = await createProduct(productData);
      if (success) {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        toast.success('Flower created successfully!');
        navigate('/admin/products');
      }
    } catch (error) {
      console.error('Error creating flower:', error);
      toast.error('Failed to create flower');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-800 mb-8 flex items-center">
        <GiFlowerEmblem className="mr-3 text-pink-600" />
        Create New Flower
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{uploadError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flower Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., Red Rose Bouquet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                maxLength="200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Description
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Detailed description..."
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="299"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="399"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {badges.map(badge => (
                    <option key={badge} value={badge}>{badge || 'None'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(true)}
                  className="text-sm text-pink-600 hover:text-pink-700 flex items-center"
                >
                  <FaPlus className="mr-1" size={12} />
                  Add New Category
                </button>
              </div>
              
              {showNewCategoryInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                    >
                      Add Category
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select a flower category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occasions
              </label>
              <select
                multiple
                value={formData.occasion}
                onChange={handleOccasionChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 h-32"
              >
                {occasions.map(occ => (
                  <option key={occ} value={occ}>{occ}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="romantic, birthday, red"
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="How to care for this flower..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flower Images * (Max 5MB each)
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
                  Click to upload images
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
                  className="inline-block px-4 py-2 bg-pink-600 text-white rounded-lg cursor-pointer hover:bg-pink-700"
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
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Featured Flower</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={handleChange}
                  className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Best Seller</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || formData.images.length === 0 || !formData.category}
            className="px-6 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <GiFlowerEmblem className="mr-2" />
            {submitting ? 'Creating...' : 'Create Flower'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;