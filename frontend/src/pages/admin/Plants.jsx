import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye } from 'react-icons/fa';
import { GiPlantRoots } from 'react-icons/gi';
import toast from 'react-hot-toast';

const Plants = () => {
  const { products, fetchProducts, deleteProduct, loading } = useAdmin();
  const [plants, setPlants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlants, setFilteredPlants] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      // STRICT FILTERING: Only show products with type='indoor' or clear plant categories
      const plantProducts = products.filter(product => {
        // First check explicit type
        if (product.type === 'indoor') return true;
        
        // If no type, check if it IS a plant based on category/name
        if (!product.type && isPlantCategory(product)) return true;
        
        return false;
      });
      
      console.log('Filtered plants:', plantProducts.length);
      setPlants(plantProducts);
    } else {
      setPlants([]);
    }
  }, [products]);

  // Helper function to detect if a product is a plant based on category or name
  const isPlantCategory = (product) => {
    const plantCategories = [
      'Snake Plant', 'Peace Lily', 'Monstera', 'Succulents', 'Cactus', 'Fern',
      'Pothos', 'ZZ Plant', 'Bonsai', 'Aloe', 'Spider Plant', 'Rubber Plant',
      'Fiddle Leaf Fig', 'Calathea', 'Philodendron', 'Air Plants'
    ];
    
    const plantKeywords = ['plant', 'bonsai', 'aloe', 'cactus', 'succulent', 'fern', 'pothos', 'zz'];
    
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
    if (plants.length > 0) {
      const filtered = plants.filter(plant =>
        plant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlants(filtered);
    } else {
      setFilteredPlants([]);
    }
  }, [searchTerm, plants]);

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

  if (loading && plants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-800 flex items-center">
          <GiPlantRoots className="mr-3 text-green-600" />
          Plants Management
        </h1>
        <Link
          to="/admin/plants/create"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
        >
          <FaPlus />
          <span>Add New Plant</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search plants by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Plants Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {filteredPlants.length === 0 ? (
          <div className="text-center py-16">
            <GiPlantRoots className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No plants found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'Get started by adding your first plant'}
            </p>
            {!searchTerm && (
              <Link to="/admin/plants/create" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                Add Your First Plant
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
                  <th className="text-left py-4 px-6 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlants.map((plant) => {
                  const imageUrl = getImageUrl(plant);
                  
                  return (
                    <tr key={plant._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-6">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={plant.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-sm"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/48x48/green/white?text=Plant';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <GiPlantRoots className="text-green-600 text-xl" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 font-medium">{plant.name}</td>
                      <td className="py-3 px-6">{plant.category?.name || 'Uncategorized'}</td>
                      <td className="py-3 px-6 font-bold text-green-600">₹{plant.price?.toFixed(2)}</td>
                      <td className="py-3 px-6">
                        <span className={plant.stock < 10 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          {plant.stock}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex space-x-2">
                          <Link
                            to={`/flower/${plant._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/admin/plants/edit/${plant._id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(plant._id, plant.name)}
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
              Showing {filteredPlants.length} of {plants.length} plants
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Plants;