import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddPlant = () => {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    oldPrice: '',
    category: '',
    careLevel: 'Easy',
    waterNeeds: 'Weekly',
    airPurifying: false,
    petFriendly: false,
    careInstructions: '',
    tags: '',
    stock: '0',
    images: []
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPlantCategories();
  }, []);

  const fetchPlantCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories?type=indoor');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.post('/api/admin/plants', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage({ type: 'success', text: 'Plant created successfully!' });
      // Reset form
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        price: '',
        oldPrice: '',
        category: '',
        careLevel: 'Easy',
        waterNeeds: 'Weekly',
        airPurifying: false,
        petFriendly: false,
        careInstructions: '',
        tags: '',
        stock: '0',
        images: []
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error creating plant' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-plant-container">
      <h1>Add New Plant</h1>
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="plant-form">
        <div className="form-group">
          <label>Plant Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Snake Plant"
            required
          />
        </div>

        <div className="form-group">
          <label>Short Description *</label>
          <textarea
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            placeholder="Brief description (max 200 characters)"
            maxLength="200"
            required
          />
        </div>

        <div className="form-group">
          <label>Full Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed plant description..."
            rows="5"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (£) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="499"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Old Price (£)</label>
            <input
              type="number"
              name="oldPrice"
              value={formData.oldPrice}
              onChange={handleChange}
              placeholder="699"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <small>{categories.length} plant categories available</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Care Level</label>
            <select name="careLevel" value={formData.careLevel} onChange={handleChange}>
              <option value="Easy">🌿 Easy</option>
              <option value="Moderate">🌱 Moderate</option>
              <option value="Difficult">🌵 Difficult</option>
            </select>
          </div>

          <div className="form-group">
            <label>Water Needs</label>
            <select name="waterNeeds" value={formData.waterNeeds} onChange={handleChange}>
              <option value="Weekly">💧 Weekly</option>
              <option value="Bi-weekly">💧 Bi-weekly</option>
              <option value="Monthly">💧 Monthly</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="airPurifying"
                checked={formData.airPurifying}
                onChange={handleChange}
              />
              🏠 Air Purifying
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="petFriendly"
                checked={formData.petFriendly}
                onChange={handleChange}
              />
              🐾 Pet Friendly
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Care Instructions</label>
          <textarea
            name="careInstructions"
            value={formData.careInstructions}
            onChange={handleChange}
            placeholder="How to care for this plant..."
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="air purifying, easy care, pet friendly"
          />
        </div>

        <div className="form-group">
          <label>Stock Quantity *</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Plant'}
        </button>
      </form>
    </div>
  );
};

export default AddPlant;