import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { productAPI, categoryAPI, adminAPI } from '../../services/api';
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

  useEffect(() => {
    fetchPlant();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      let categoriesData = [];
      
      try {
        const response = await categoryAPI.getAll();
        categoriesData = response.data;
      } catch (error) {
        console.log('Using fallback categories');
        categoriesData = [
          { _id: 'snake-plant', name: 'Snake Plant' },
          { _id: 'peace-lily', name: 'Peace Lily' },
          { _id: 'monstera', name: 'Monstera' },
          { _id: 'succulents', name: 'Succulents' },
          { _id: 'cactus', name: 'Cactus' },
          { _id: 'fern', name: 'Fern' }
        ];
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-800 mb-8 flex items-center">
        <GiPlantRoots className="mr-3 text-green-600" />
        Edit Plant
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        {/* Similar form structure as CreatePlant but with current images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Same form fields as CreatePlant */}
          {/* ... */}
        </div>
      </form>
    </div>
  );
};

export default EditPlant;