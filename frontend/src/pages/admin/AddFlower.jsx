import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddFlower = () => {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: '',
    oldPrice: '',
    category: '',
    occasion: [],
    tags: '',
    stock: '0',
    images: []
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const occasionOptions = [
    'Birthday', 'Anniversary', 'Wedding', 'Sympathy', 'Get Well', 'Just Because'
  ];

  useEffect(() => {
    fetchFlowerCategories();
  }, []);

  const fetchFlowerCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories?type=flower');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.post('/api/admin/flowers', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage({ type: 'success', text: 'Flower created successfully!' });
      // Reset form
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        price: '',
        oldPrice: '',
        category: '',
        occasion: [],
        tags: '',
        stock: '0',
        images: []
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error creating flower' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-flower-container">
      <h1>Add New Flower</h1>
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flower-form">
        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Red Rose Bouquet"
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
            placeholder="Detailed product description..."
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
        </div>

        <div className="form-group">
          <label>Occasions (Hold Ctrl to select multiple)</label>
          <select
            multiple
            value={formData.occasion}
            onChange={handleOccasionChange}
            size="6"
          >
            {occasionOptions.map(occasion => (
              <option key={occasion} value={occasion}>
                {occasion}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="romantic, birthday, red"
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
          {loading ? 'Creating...' : 'Create Flower'}
        </button>
      </form>
    </div>
  );
};

export default AddFlower;