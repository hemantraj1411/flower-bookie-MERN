import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api'; // Changed from flowerAPI to productAPI
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import FlowerCard from '../components/FlowerCard';
import { FaStar, FaShoppingCart, FaHeart, FaShare, FaCheck, FaTruck, FaLeaf } from 'react-icons/fa';
import { FaShieldHeart } from 'react-icons/fa6';
import toast from 'react-hot-toast';

const FlowerDetail = () => {
  const { id } = useParams();
  const [flower, setFlower] = useState(null);
  const [relatedFlowers, setRelatedFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchFlowerDetails();
  }, [id]);

  const fetchFlowerDetails = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getById(id); // Changed from flowerAPI to productAPI
      console.log('Product details:', response.data);
      
      // Handle the response structure from your backend
      const productData = response.data.product || response.data;
      setFlower(productData);
      
      // Fetch related products if available
      if (response.data.relatedProducts) {
        setRelatedFlowers(response.data.relatedProducts);
      } else {
        // If no related products in response, fetch based on category
        const relatedRes = await productAPI.getAll({
          category: productData.category,
          limit: 4
        });
        const related = relatedRes.data.products || relatedRes.data;
        setRelatedFlowers(related.filter(p => p._id !== id).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching flower details:', error);
      toast.error('Failed to load flower details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const success = await addToCart(id, quantity);
    if (success) {
      toast.success('Added to cart!');
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (flower?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) return <Loader />;
  if (!flower) return <div>Flower not found</div>;

  const images = flower.images || [flower.image || 'https://via.placeholder.com/500'];

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm breadcrumbs mb-8">
          <ul className="flex space-x-2 text-gray-500">
            <li><Link to="/" className="hover:text-pink-600">Home</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link to="/shop" className="hover:text-pink-600">Shop</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link to={`/shop?category=${flower.category}`} className="hover:text-pink-600">{flower.category?.name || flower.category}</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900">{flower.name}</li>
          </ul>
        </div>

        {/* Product Main - Rest of the component remains the same */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div>
            <div className="main-image mb-4">
              <img
                src={images[selectedImage]}
                alt={flower.name}
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
            </div>
            {images.length > 1 && (
              <div className="thumbnails grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`border-2 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'border-pink-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url || img} alt={`${flower.name} ${index + 1}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="font-display text-4xl font-bold text-gray-800 mb-4">{flower.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={i < (flower.rating || 0) ? 'fill-current' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-gray-600">({flower.numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              {flower.oldPrice ? (
                <div className="flex items-center space-x-4">
                  <span className="text-4xl font-bold text-pink-600">${flower.price}</span>
                  <span className="text-2xl text-gray-400 line-through">${flower.oldPrice}</span>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    Save ${flower.oldPrice - flower.price}
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-pink-600">${flower.price}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-lg mb-8">{flower.description}</p>

            {/* Availability */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-green-600 mb-2">
                <FaCheck className="mr-2" />
                <span className="font-medium">
                  {flower.stock > 0 ? `In Stock (${flower.stock} available)` : 'Out of Stock'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Free shipping on orders over $50
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block font-medium mb-3">Quantity</label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="px-4 py-2 text-xl hover:bg-gray-100 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-6 py-2 text-lg border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="px-4 py-2 text-xl hover:bg-gray-100 transition-colors"
                    disabled={quantity >= flower.stock}
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-500">Total: ${(flower.price * quantity).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 btn-primary py-4 text-lg flex items-center justify-center space-x-2"
                disabled={flower.stock === 0}
              >
                <FaShoppingCart />
                <span>Add to Cart</span>
              </button>
              <button className="p-4 border-2 border-pink-500 text-pink-500 rounded-lg hover:bg-pink-50 transition-colors">
                <FaHeart size={24} />
              </button>
              <button className="p-4 border-2 border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                <FaShare size={24} />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
              <div className="text-center">
                <FaTruck className="text-2xl text-pink-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Free Delivery</p>
                <p className="text-xs text-gray-500">On orders $50+</p>
              </div>
              <div className="text-center">
                <FaShieldHeart className="text-2xl text-pink-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Freshness Guarantee</p>
                <p className="text-xs text-gray-500">7-day promise</p>
              </div>
              <div className="text-center">
                <FaLeaf className="text-2xl text-pink-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Eco-Friendly</p>
                <p className="text-xs text-gray-500">Sustainable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button className="py-4 px-1 border-b-2 border-pink-600 text-pink-600 font-medium">
                Details
              </button>
              <button className="py-4 px-1 text-gray-500 hover:text-gray-700 font-medium">
                Care Instructions
              </button>
              <button className="py-4 px-1 text-gray-500 hover:text-gray-700 font-medium">
                Reviews ({flower.numReviews || 0})
              </button>
            </nav>
          </div>
          <div className="py-6">
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold mb-4">Product Details</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><span className="font-medium">Category:</span> {flower.category?.name || flower.category}</li>
                <li><span className="font-medium">Occasion:</span> {flower.occasion?.join(', ') || 'All Occasions'}</li>
                {flower.specifications && Object.entries(flower.specifications).map(([key, value]) => (
                  <li key={key}><span className="font-medium">{key}:</span> {value}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedFlowers.length > 0 && (
          <div>
            <h2 className="section-title">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedFlowers.map(flower => (
                <FlowerCard key={flower._id} flower={flower} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowerDetail;