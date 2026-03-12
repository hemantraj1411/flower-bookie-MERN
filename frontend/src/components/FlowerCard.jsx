import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  FaShoppingCart, 
  FaHeart, 
  FaStar, 
  FaRegStar, 
  FaStarHalfAlt, 
  FaRupeeSign 
} from 'react-icons/fa';
import { GiFlowerEmblem } from 'react-icons/gi';
import toast from 'react-hot-toast';

const FlowerCard = ({ flower }) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);

  const getBackendUrl = () => {
    return 'http://localhost:5000';
  };

  const getImageUrl = () => {
    if (!flower) {
      return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    }

    if (imageError) {
      return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    }

    // If flower has images array
    if (flower.images && Array.isArray(flower.images) && flower.images.length > 0) {
      const img = flower.images[0];
      
      // If image is an object with url property
      if (img && typeof img === 'object') {
        if (img.url) {
          // Check if url already has full path
          if (img.url.startsWith('http')) {
            return img.url;
          } else if (img.url.startsWith('/uploads/')) {
            return `${getBackendUrl()}${img.url}`;
          } else {
            return `${getBackendUrl()}/uploads/${img.url}`;
          }
        } else if (img.publicId) {
          return `${getBackendUrl()}/uploads/${img.publicId}`;
        }
      }
      
      // If image is a string
      if (typeof img === 'string') {
        if (img.startsWith('http')) {
          return img;
        } else if (img.startsWith('/uploads/')) {
          return `${getBackendUrl()}${img}`;
        } else {
          return `${getBackendUrl()}/uploads/${img}`;
        }
      }
    }
    
    // If flower has image property (legacy)
    if (flower.image) {
      if (flower.image.startsWith('http')) {
        return flower.image;
      } else if (flower.image.startsWith('/uploads/')) {
        return `${getBackendUrl()}${flower.image}`;
      } else {
        return `${getBackendUrl()}/uploads/${flower.image}`;
      }
    }

    // Fallback image
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (flower.stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    
    try {
      const productForCart = {
        _id: flower._id,
        name: flower.name,
        price: flower.price,
        image: imageUrl,
        images: flower.images,
        stock: flower.stock,
        category: flower.category,
        type: 'flower'
      };

      const success = await addToCart(productForCart, 1);
      if (success) {
        toast.success(`${flower.name} added to cart!`);
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const imageUrl = getImageUrl();

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
  };

  // Render rating stars
  const renderRating = () => {
    const rating = flower.rating || 0;
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

  // Get badge color
  const getBadgeColor = () => {
    switch(flower.badge) {
      case 'New': return 'bg-pink-500';
      case 'Sale': return 'bg-red-500';
      case 'Best Seller': return 'bg-yellow-500';
      case 'Limited': return 'bg-purple-500';
      case 'Seasonal': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Link to={`/product/${flower.slug || flower._id}`} className="group block">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
          <img
            src={imageUrl}
            alt={flower.name || 'Flower'}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Badge */}
          {flower.badge && (
            <span className={`absolute top-3 left-3 ${getBadgeColor()} text-white text-xs font-bold px-2 py-1 rounded-full`}>
              {flower.badge}
            </span>
          )}
          
          {/* Sale Badge */}
          {flower.oldPrice && flower.oldPrice > flower.price && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {Math.round(((flower.oldPrice - flower.price) / flower.oldPrice) * 100)}% OFF
            </div>
          )}
          
          {/* Stock Status */}
          {flower.stock <= 0 && (
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
          <p className="text-sm text-pink-600 mb-1">{flower.category?.name || 'Flower'}</p>
          
          {/* Name */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {flower.name || 'Unnamed Flower'}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex mr-2">
              {renderRating()}
            </div>
            <span className="text-sm text-gray-600">
              ({flower.numReviews || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-pink-600 flex items-center">
                <FaRupeeSign size={14} /> {flower.price}
              </span>
              {flower.oldPrice > flower.price && (
                <span className="ml-2 text-sm text-gray-400 line-through flex items-center">
                  <FaRupeeSign size={10} /> {flower.oldPrice}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          {flower.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaShoppingCart className="mr-2" /> Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default FlowerCard;