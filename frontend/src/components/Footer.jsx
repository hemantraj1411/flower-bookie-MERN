import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaPinterest } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-display text-2xl mb-4">🌸 FlowerBookie</h3>
            <p className="text-gray-400 mb-4">
              Bringing nature's beauty to your doorstep with the freshest flowers for every occasion.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                <FaPinterest size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-pink-400">Home</Link></li>
              <li><Link to="/shop" className="text-gray-400 hover:text-pink-400">Shop</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-pink-400">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-pink-400">Contact</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><Link to="/shop?category=roses" className="text-gray-400 hover:text-pink-400">Roses</Link></li>
              <li><Link to="/shop?category=wedding" className="text-gray-400 hover:text-pink-400">Wedding Flowers</Link></li>
              <li><Link to="/shop?category=birthday" className="text-gray-400 hover:text-pink-400">Birthday</Link></li>
              <li><Link to="/shop?category=anniversary" className="text-gray-400 hover:text-pink-400">Anniversary</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li>📍 123 Flower Street</li>
              <li>📞 (555) 123-4567</li>
              <li>✉️ hello@flowerbookie.com</li>
              <li>🕒 Mon-Sat: 9am-7pm</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 FlowerBookie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;