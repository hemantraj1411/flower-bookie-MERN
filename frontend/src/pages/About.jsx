import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaLeaf, FaTruck, FaStar } from 'react-icons/fa';

const About = () => {
  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Head Florist',
      image: 'https://images.unsplash.com/photo-1494790108777-466fd0c6b1b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      bio: 'With over 15 years of experience, Sarah brings creativity and passion to every arrangement.'
    },
    {
      name: 'Michael Chen',
      role: 'Master Gardener',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      bio: 'Michael ensures we source the freshest and most beautiful flowers from sustainable farms.'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Customer Love',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      bio: 'Emma makes sure every customer feels special and gets the perfect flowers for their occasion.'
    }
  ];

  const stats = [
    { icon: FaHeart, value: '10K+', label: 'Happy Customers' },
    { icon: FaLeaf, value: '500+', label: 'Flower Varieties' },
    { icon: FaTruck, value: '24/7', label: 'Delivery Service' },
    { icon: FaStar, value: '4.9', label: 'Customer Rating' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Flower shop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/70 to-purple-900/70" />
        </div>
        
        <div className="relative text-center text-white z-10 px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Our Story
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Bringing beauty and joy to your doorstep, one flower at a time
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="text-4xl text-pink-600 mx-auto mb-3" />
                <div className="font-display text-3xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gradient-to-b from-pink-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title">Our Journey</h2>
            <div className="prose prose-lg mx-auto text-gray-600 space-y-6">
              <p>
                FlowerBookie was born from a simple idea: everyone deserves to experience the joy of fresh flowers. What started as a small local flower shop in 2015 has grown into a beloved online destination for flower lovers across the country.
              </p>
              <p>
                Our founder, Sarah, began arranging flowers in her grandmother's garden as a child. That early passion blossomed into a career, and she dreamed of sharing that beauty with more people. Today, we're proud to deliver hand-arranged, premium flowers to doorsteps everywhere.
              </p>
              <p>
                We believe flowers are more than just decorations – they're expressions of love, sympathy, celebration, and care. That's why every bouquet we create is crafted with intention, ensuring that your emotions are perfectly conveyed through our blooms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-xl bg-pink-50">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLeaf className="text-3xl text-pink-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Sustainability</h3>
              <p className="text-gray-600">
                We partner with eco-friendly farms and use biodegradable packaging to minimize our environmental footprint.
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-purple-50">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHeart className="text-3xl text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Quality First</h3>
              <p className="text-gray-600">
                Every flower is hand-selected for freshness and beauty. We never compromise on quality.
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-blue-50">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTruck className="text-3xl text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-3">Community</h3>
              <p className="text-gray-600">
                We support local communities and donate a portion of every sale to community gardens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-4">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            The passionate people behind your beautiful blooms
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="font-display text-xl font-bold text-gray-800 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-pink-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to Bloom?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Explore our collection and find the perfect flowers for your special moment
          </p>
          <Link to="/shop" className="bg-white text-pink-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-pink-50 transition-colors inline-block">
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;