import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar, FaStarHalfAlt, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  // Get primary image or first image
  const getPrimaryImage = () => {
    if (product.images && product.images.length > 0) {
      // Check if there's a primary image
      const primary = product.images.find(img => img.isPrimary);
      if (primary) return primary.url;
      return product.images[0].url;
    }
    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  // Render rating stars
  const renderRating = () => {
    const rating = product.rating || 0;
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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    
    addToCart(product, 1);
    toast.success('Added to cart!');
  };

  // Get badge color
  const getBadgeColor = () => {
    switch(product.badge) {
      case 'New':
        return 'bg-green-500';
      case 'Sale':
        return 'bg-red-500';
      case 'Best Seller':
        return 'bg-yellow-500';
      case 'Limited':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Link to={`/product/${product.slug || product._id}`} className="group">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={getPrimaryImage()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
            }}
          />
          
          {/* Badge */}
          {product.badge && (
            <span className={`absolute top-3 left-3 ${getBadgeColor()} text-white text-xs font-bold px-2 py-1 rounded`}>
              {product.badge}
            </span>
          )}
          
          {/* Stock Status */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                Out of Stock
              </span>
            </div>
          )}
          
          {/* Quick Add Button */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-3 right-3 bg-green-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-700"
            >
              <FaShoppingCart />
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {product.name}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex mr-2">
              {renderRating()}
            </div>
            <span className="text-sm text-gray-600">
              ({product.numReviews || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-green-600">
                ₹{product.price}
              </span>
              {product.oldPrice > product.price && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  ₹{product.oldPrice}
                </span>
              )}
            </div>
            
            {/* Plant-specific badges */}
            {product.type === 'indoor' && (
              <div className="flex space-x-1">
                {product.airPurifying && (
                  <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded" title="Air Purifying">
                    🌿
                  </span>
                )}
                {product.petFriendly && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded" title="Pet Friendly">
                    🐾
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Short Description */}
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {product.shortDescription}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;