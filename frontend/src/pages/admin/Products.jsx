import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye } from 'react-icons/fa';
import { GiFlowerEmblem } from 'react-icons/gi';
import toast from 'react-hot-toast';

const Products = () => {
  const { products, fetchProducts, deleteProduct, loading } = useAdmin();
  const [flowers, setFlowers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFlowers, setFilteredFlowers] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      // STRICT FILTERING: Only show products with type='flower'
      // Also exclude any products that have plant categories
      const flowerProducts = products.filter(product => {
        // First check explicit type
        if (product.type === 'flower') return true;
        
        // If no type, check if it's NOT a plant
        if (!product.type && !isPlantCategory(product)) return true;
        
        return false;
      });
      
      console.log('Filtered flowers:', flowerProducts.length);
      setFlowers(flowerProducts);
    } else {
      setFlowers([]);
    }
  }, [products]);

  // Helper function to detect if a product is a plant based on category or name
  const isPlantCategory = (product) => {
    const plantCategories = [
      'Snake Plant', 'Peace Lily', 'Monstera', 'Succulents', 'Cactus', 'Fern',
      'Pothos', 'ZZ Plant', 'Bonsai', 'Aloe', 'Spider Plant', 'Rubber Plant',
      'Fiddle Leaf Fig', 'Calathea', 'Philodendron', 'Air Plants'
    ];
    
    const plantKeywords = ['plant', 'bonsai', 'aloe', 'cactus', 'succulent', 'fern', 'pothos'];
    
    const categoryName = product.category?.name?.toLowerCase() || 
                         (typeof product.category === 'string' ? product.category.toLowerCase() : '');
    
    const productName = product.name?.toLowerCase() || '';
    
    // Check if category is a plant category
    const isPlantCat = plantCategories.some(cat => 
      categoryName.includes(cat.toLowerCase())
    );
    
    // Check if name contains plant keywords
    const isPlantName = plantKeywords.some(keyword => 
      productName.includes(keyword)
    );
    
    return isPlantCat || isPlantName;
  };

  useEffect(() => {
    if (flowers.length > 0) {
      const filtered = flowers.filter(flower =>
        flower.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flower.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFlowers(filtered);
    } else {
      setFilteredFlowers([]);
    }
  }, [searchTerm, flowers]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteProduct(id);
    }
  };

  const getImageUrl = (product) => {
    if (!product) return null;
    
    if (product.images && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        if (img.startsWith('http')) return img;
        if (img.startsWith('/uploads')) return `http://localhost:5000${img}`;
        return `http://localhost:5000/uploads/${img}`;
      }
      if (img && img.url) {
        if (img.url.startsWith('http')) return img.url;
        if (img.url.startsWith('/uploads')) return `http://localhost:5000${img.url}`;
        return `http://localhost:5000/uploads/${img.url}`;
      }
    }
    return null;
  };

  if (loading && flowers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flowers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center">
          <GiFlowerEmblem className="mr-3 text-pink-600" />
          Flowers Management
        </h1>
        <Link
          to="/admin/products/create"
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
        >
          <FaPlus />
          <span>Add New Flower</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search flowers by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Flowers Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {filteredFlowers.length === 0 ? (
          <div className="text-center py-16">
            <GiFlowerEmblem className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No flowers found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'Get started by adding your first flower'}
            </p>
            {!searchTerm && (
              <Link to="/admin/products/create" className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors">
                Add Your First Flower
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Image</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Price</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Stock</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlowers.map((flower) => {
                  const imageUrl = getImageUrl(flower);
                  
                  return (
                    <tr key={flower._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={flower.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-sm"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/48x48/pink/white?text=Flower';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                            <GiFlowerEmblem className="text-pink-600 text-xl" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 font-medium">{flower.name}</td>
                      <td className="py-3 px-6">{flower.category?.name || 'Uncategorized'}</td>
                      <td className="py-3 px-6 font-bold text-pink-600">₹{flower.price?.toFixed(2)}</td>
                      <td className="py-3 px-6">
                        <span className={flower.stock < 10 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          {flower.stock}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          flower.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {flower.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex space-x-2">
                          <Link
                            to={`/flower/${flower._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/admin/products/edit/${flower._id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(flower._id, flower.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing {filteredFlowers.length} of {flowers.length} flowers
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;