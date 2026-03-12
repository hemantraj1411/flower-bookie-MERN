import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaStar, 
  FaRegStar, 
  FaStarHalfAlt, 
  FaRupeeSign, 
  FaTint, 
  FaLeaf, 
  FaPaw, 
  FaShieldAlt,
  FaBook
} from 'react-icons/fa';
import { GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';

const PlantCard = ({ plant }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';

  // Function to get the correct image URL
  const getImageUrl = () => {
    if (!plant) return fallbackImage;

    try {
      // If plant has images array
      if (plant.images && Array.isArray(plant.images) && plant.images.length > 0) {
        const img = plant.images[0];
        
        // If image is an object with url property
        if (img && typeof img === 'object') {
          if (img.url) {
            // Cloudinary URL - already full URL
            if (img.url.includes('cloudinary.com')) {
              // Add transformations for better performance
              return img.url.replace('/upload/', '/upload/w_500,h_500,c_fill,q_auto,f_auto/');
            }
            // Full HTTP URL
            else if (img.url.startsWith('http')) {
              return img.url;
            }
            // Relative path starting with /uploads/
            else if (img.url.startsWith('/uploads/')) {
              return `http://localhost:5000${img.url}`;
            }
            // Just filename
            else {
              return `http://localhost:5000/uploads/${img.url}`;
            }
          } 
          // If publicId exists but no url (shouldn't happen with Cloudinary)
          else if (img.publicId) {
            // Try to construct Cloudinary URL if we have cloud name
            const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
            if (cloudName) {
              return `https://res.cloudinary.com/${cloudName}/image/upload/w_500,h_500,c_fill,q_auto,f_auto/${img.publicId}`;
            }
          }
        }
        
        // If image is a string
        if (typeof img === 'string') {
          if (img.startsWith('http')) {
            return img;
          } else if (img.startsWith('/uploads/')) {
            return `http://localhost:5000${img}`;
          } else {
            return `http://localhost:5000/uploads/${img}`;
          }
        }
      }
      
      // If plant has image property (legacy)
      if (plant.image) {
        if (plant.image.startsWith('http')) {
          return plant.image;
        } else if (plant.image.startsWith('/uploads/')) {
          return `http://localhost:5000${plant.image}`;
        } else {
          return `http://localhost:5000/uploads/${plant.image}`;
        }
      }
    } catch (error) {
      console.error('Error parsing image URL:', error);
    }

    return fallbackImage;
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (plant.stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    
    try {
      const productForCart = {
        _id: plant._id,
        name: plant.name,
        price: plant.price,
        image: getImageUrl(),
        images: plant.images,
        stock: plant.stock,
        category: plant.category,
        type: 'indoor'
      };

      // The addToCart function from CartContext will handle auth check
      const success = await addToCart(productForCart, 1);
      // No need to show success message here as it's handled in CartContext
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Get the image URL once
  const imageUrl = getImageUrl();
  
  // Handle image error
  const handleImageError = (e) => {
    console.log('Image failed to load:', imageUrl);
    setImageError(true);
    e.target.src = fallbackImage;
  };

  // Render rating stars
  const renderRating = () => {
    const rating = plant.rating || 0;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    return stars;
  };

  // Get care level color
  const getCareLevelColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'difficult': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get badge color
  const getBadgeColor = () => {
    switch(plant.badge) {
      case 'New': return 'bg-green-500';
      case 'Sale': return 'bg-red-500';
      case 'Best Seller': return 'bg-yellow-500';
      case 'Limited': return 'bg-purple-500';
      case 'Seasonal': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="group relative">
      <Link to={`/product/${plant.slug || plant._id}`} className="block">
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          {/* Image Container */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
            <img
              src={imageError ? fallbackImage : imageUrl}
              alt={plant.name || 'Plant'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={handleImageError}
              loading="lazy"
            />
            
            {/* Badge */}
            {plant.badge && !imageError && (
              <span className={`absolute top-3 left-3 ${getBadgeColor()} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                {plant.badge}
              </span>
            )}
            
            {/* Care Level Badge */}
            {plant.careLevel && !imageError && (
              <span className={`absolute top-3 right-3 ${getCareLevelColor(plant.careLevel)} text-xs font-bold px-2 py-1 rounded-full flex items-center`}>
                <FaLeaf className="mr-1" size={10} /> {plant.careLevel}
              </span>
            )}
            
            {/* Stock Status */}
            {plant.stock <= 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Category */}
            <p className="text-sm text-green-600 mb-1">{plant.category?.name || 'Plant'}</p>
            
            {/* Name */}
            <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
              {plant.name || 'Unnamed Plant'}
            </h3>
            
            {/* Plant Features */}
            <div className="flex flex-wrap gap-2 mb-3">
              {plant.waterNeeds && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center">
                  <FaTint className="mr-1" size={10} /> {plant.waterNeeds}
                </span>
              )}
              {plant.airPurifying && (
                <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-full flex items-center">
                  <FaShieldAlt className="mr-1" size={10} /> Air Purifying
                </span>
              )}
              {plant.petFriendly && (
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full flex items-center">
                  <FaPaw className="mr-1" size={10} /> Pet Friendly
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center mb-3">
              <div className="flex mr-2">
                {renderRating()}
              </div>
              <span className="text-sm text-gray-600">
                ({plant.numReviews || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xl font-bold text-green-600 flex items-center">
                  <FaRupeeSign size={14} /> {plant.price}
                </span>
                {plant.oldPrice > plant.price && (
                  <span className="ml-2 text-sm text-gray-400 line-through flex items-center">
                    <FaRupeeSign size={10} /> {plant.oldPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Add to Cart Button */}
            {plant.stock > 0 && (
              <button
                onClick={handleAddToCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaShoppingCart className="mr-2" /> Add to Cart
              </button>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Care Link */}
      <Link
        to={`/plant-care-guide#${plant.careLevel?.toLowerCase() || 'general'}-care`}
        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-green-600 px-2 py-1 rounded-full text-xs font-medium hover:bg-green-600 hover:text-white transition-colors flex items-center shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <FaBook className="mr-1" size={10} /> Quick Care
      </Link>
    </div>
  );
};

export default PlantCard;