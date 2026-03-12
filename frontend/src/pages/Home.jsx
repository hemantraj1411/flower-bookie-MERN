import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import FlowerCard from '../components/FlowerCard';
import PlantCard from '../components/PlantCard';
import Loader from '../components/Loader';
import { 
  FaTruck, 
  FaLeaf, 
  FaHeadset,
  FaLock,
  FaArrowRight,
  FaStar,
  FaHeart
} from 'react-icons/fa';
import { FaShieldHeart } from 'react-icons/fa6';
import { GiPlantRoots, GiFlowerEmblem, GiSunflower } from 'react-icons/gi';
import toast from 'react-hot-toast';

const Home = () => {
  const [featuredFlowers, setFeaturedFlowers] = useState([]);
  const [featuredPlants, setFeaturedPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('📦 Fetching products...');
        
        // Fetch flowers with type=flower
        const flowersRes = await productAPI.getFlowers({ limit: 4 });
        console.log('✅ Flowers:', flowersRes.data);
        
        // Fetch plants with type=indoor
        const plantsRes = await productAPI.getPlants({ limit: 4 });
        console.log('✅ Plants:', plantsRes.data);
        
        // Handle different response structures
        let flowers = [];
        let plants = [];
        
        if (flowersRes.data) {
          if (Array.isArray(flowersRes.data)) {
            flowers = flowersRes.data;
          } else if (flowersRes.data.flowers && Array.isArray(flowersRes.data.flowers)) {
            flowers = flowersRes.data.flowers;
          } else if (flowersRes.data.products && Array.isArray(flowersRes.data.products)) {
            flowers = flowersRes.data.products;
          }
        }
        
        if (plantsRes.data) {
          if (Array.isArray(plantsRes.data)) {
            plants = plantsRes.data;
          } else if (plantsRes.data.plants && Array.isArray(plantsRes.data.plants)) {
            plants = plantsRes.data.plants;
          } else if (plantsRes.data.products && Array.isArray(plantsRes.data.products)) {
            plants = plantsRes.data.products;
          }
        }
        
        setFeaturedFlowers(flowers.slice(0, 4));
        setFeaturedPlants(plants.slice(0, 4));
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        toast.error('Failed to load products');
        setFeaturedFlowers([]);
        setFeaturedPlants([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      toast.success(`Thank you for subscribing with: ${email}`);
      setEmail('');
    }
  };

  const flowerCategories = [
    { name: 'Roses', icon: '🌹', link: '/shop?category=Roses', color: 'from-red-400 to-red-600' },
    { name: 'Tulips', icon: '🌷', link: '/shop?category=Tulips', color: 'from-pink-400 to-pink-600' },
    { name: 'Lilies', icon: '🌸', link: '/shop?category=Lilies', color: 'from-purple-400 to-purple-600' },
    { name: 'Orchids', icon: '🌺', link: '/shop?category=Orchids', color: 'from-fuchsia-400 to-fuchsia-600' },
    { name: 'Sunflowers', icon: '🌻', link: '/shop?category=Sunflowers', color: 'from-yellow-400 to-yellow-600' },
    { name: 'Mixed Bouquets', icon: '💐', link: '/shop?category=Mixed Bouquets', color: 'from-pink-400 to-rose-600' },
  ];

  const plantCategories = [
    { name: 'Snake Plant', icon: '🌿', link: '/shop?category=Snake Plant', care: 'Easy', color: 'from-green-500 to-emerald-700' },
    { name: 'Peace Lily', icon: '🪴', link: '/shop?category=Peace Lily', care: 'Moderate', color: 'from-green-400 to-green-600' },
    { name: 'Monstera', icon: '🌱', link: '/shop?category=Monstera', care: 'Moderate', color: 'from-emerald-500 to-teal-700' },
    { name: 'Succulents', icon: '🌵', link: '/shop?category=Succulents', care: 'Easy', color: 'from-lime-500 to-green-700' },
    { name: 'Cactus', icon: '🌵', link: '/shop?category=Cactus', care: 'Easy', color: 'from-green-600 to-lime-800' },
    { name: 'Fern', icon: '🍃', link: '/shop?category=Fern', care: 'Expert', color: 'from-emerald-600 to-green-800' },
  ];

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Flower field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/60 via-emerald-800/60 to-pink-900/60" />
        </div>
        
        <div className="relative text-center text-white z-10 px-4 max-w-4xl">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 animate-fade-in">
            Nature's Beauty
          </h1>
          <p className="text-2xl md:text-3xl mb-2 font-light">
            Delivered to Your Doorstep
          </p>
          <p className="text-xl md:text-2xl mb-10 opacity-90">
            Fresh flowers and lush indoor plants for every space
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop?type=flower" className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center">
              <GiFlowerEmblem className="mr-2" /> Shop Flowers
            </Link>
            <Link to="/indoor-plants" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center">
              <GiPlantRoots className="mr-2" /> Indoor Plants
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Quick Category Navigation */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/shop?type=flower" className="flex items-center px-6 py-3 bg-pink-50 text-pink-700 rounded-full hover:bg-pink-100 transition-colors">
              <GiFlowerEmblem className="mr-2" /> All Flowers
            </Link>
            <Link to="/indoor-plants" className="flex items-center px-6 py-3 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors">
              <GiPlantRoots className="mr-2" /> All Plants
            </Link>
            <Link to="/shop?bestSeller=true" className="flex items-center px-6 py-3 bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100 transition-colors">
              <FaStar className="mr-2" /> Best Sellers
            </Link>
            <Link to="/shop?occasion=House+Warming" className="flex items-center px-6 py-3 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors">
              <FaLeaf className="mr-2" /> House Warming
            </Link>
          </div>
        </div>
      </section>

      {/* FLOWERS SECTION */}
      <section className="py-16 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-pink-100 rounded-full mb-4">
              <GiFlowerEmblem className="text-4xl text-pink-600" />
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-800 mb-3">
              Fresh Flowers
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Elegant blooms for every occasion, hand-picked and delivered with care
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {flowerCategories.map((cat, index) => (
              <Link
                key={index}
                to={cat.link}
                className={`px-4 py-2 bg-gradient-to-r ${cat.color} text-white rounded-full text-sm font-medium hover:shadow-lg transition-all hover:-translate-y-1`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>

          {featuredFlowers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredFlowers.map(flower => (
                  <FlowerCard key={flower._id} flower={flower} />
                ))}
              </div>
              
              <div className="text-center mt-10">
                <Link 
                  to="/shop?type=flower" 
                  className="inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold border-2 border-pink-200 hover:border-pink-300 px-6 py-3 rounded-full transition-all"
                >
                  View All Flowers <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <GiFlowerEmblem className="text-6xl text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No flowers yet</h3>
              <p className="text-gray-500">Check back soon for our fresh arrivals</p>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-6 py-2 rounded-full text-lg text-gray-500 flex items-center gap-2">
            <GiSunflower className="text-yellow-500" /> & <GiPlantRoots className="text-green-600" />
          </span>
        </div>
      </div>

      {/* INDOOR PLANTS SECTION */}
      <section className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
              <GiPlantRoots className="text-4xl text-green-600" />
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-800 mb-3">
              Indoor Plants
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Bring nature indoors with our collection of beautiful, easy-care plants
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {plantCategories.map((cat, index) => (
              <Link
                key={index}
                to={cat.link}
                className="group text-center"
              >
                <div className={`bg-gradient-to-br ${cat.color} text-white p-4 rounded-2xl shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-1`}>
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="font-medium text-sm">{cat.name}</h3>
                  <span className="text-xs opacity-90">{cat.care}</span>
                </div>
              </Link>
            ))}
          </div>

          {featuredPlants.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredPlants.map(plant => (
                  <PlantCard key={plant._id} plant={plant} />
                ))}
              </div>
              
              <div className="text-center mt-10">
                <Link 
                  to="/indoor-plants" 
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold border-2 border-green-200 hover:border-green-300 px-6 py-3 rounded-full transition-all"
                >
                  Explore All Plants <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <GiPlantRoots className="text-6xl text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No plants yet</h3>
              <p className="text-gray-500">Check back soon for our plant collection</p>
            </div>
          )}
        </div>
      </section>

      {/* Spring Special Banner */}
      <section className="py-16 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-2">Spring Special</h2>
              <p className="text-2xl mb-2">Get 20% Off</p>
              <p className="text-xl opacity-90">On all flowering plants and fresh flowers</p>
            </div>
            <Link 
              to="/shop?sale=true" 
              className="bg-white text-orange-600 hover:bg-orange-50 px-10 py-4 rounded-lg text-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-200 transition-colors">
                <FaTruck className="text-3xl text-pink-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Free Delivery</h3>
              <p className="text-gray-600">On orders above ₹500</p>
            </div>
            <div className="text-center group">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <FaShieldHeart className="text-3xl text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Fresh Guarantee</h3>
              <p className="text-gray-600">7-day freshness promise</p>
            </div>
            <div className="text-center group">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <FaHeadset className="text-3xl text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">24/7 Support</h3>
              <p className="text-gray-600">Dedicated customer service</p>
            </div>
            <div className="text-center group">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <FaLock className="text-3xl text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-b from-pink-50 via-white to-green-50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="flex justify-center gap-4 mb-6">
            <GiFlowerEmblem className="text-4xl text-pink-500" />
            <GiPlantRoots className="text-4xl text-green-600" />
          </div>
          <h2 className="font-display text-4xl font-bold text-gray-800 mb-3">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Get updates on new arrivals, plant care tips, and special offers
          </p>
          
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-lg"
            />
            <button type="submit" className="bg-gradient-to-r from-pink-500 to-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-pink-600 hover:to-green-700 transition-all transform hover:scale-105">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;