import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaWater, 
  FaSun, 
  FaSeedling, 
  FaLeaf, 
  FaTemperatureHigh, 
  FaCut,
  FaShieldAlt,
  FaPaw,
  FaHome,
  FaBook,
  FaVideo,
  FaQuestionCircle,
  FaArrowLeft,
  FaHeart,
  FaTint,
  FaWind,
  FaSearch
} from 'react-icons/fa';
import { GiPlantRoots, GiFlowerPot, GiGardeningShears } from 'react-icons/gi'; // Removed GiFertilizer
import { MdLocalFlorist, MdNaturePeople, MdYard } from 'react-icons/md';

const PlantCareGuide = () => {
  const careGuides = [
    {
      category: 'Watering Guide',
      icon: FaWater,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Proper watering is essential for plant health',
      tips: [
        { title: 'Check Soil Moisture', content: 'Stick your finger 1-2 inches into the soil. If dry, water; if moist, wait.' },
        { title: 'Water Thoroughly', content: 'Water until it drains from the bottom, ensuring roots get moisture.' },
        { title: 'Drainage is Key', content: 'Never let plants sit in standing water - it causes root rot.' },
        { title: 'Seasonal Changes', content: 'Plants need less water in winter, more in growing season.' }
      ],
      plants: [
        { name: 'Snake Plant', need: 'Every 2-3 weeks', level: 'Low' },
        { name: 'Peace Lily', need: 'Weekly', level: 'Moderate' },
        { name: 'Succulents', need: 'Every 2-4 weeks', level: 'Very Low' },
        { name: 'Fern', need: '2-3 times weekly', level: 'High' }
      ]
    },
    {
      category: 'Light Requirements',
      icon: FaSun,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      description: 'Understanding light needs for healthy growth',
      tips: [
        { title: 'Direct Sunlight', content: 'South or west-facing windows for plants that love full sun.' },
        { title: 'Indirect Bright Light', content: 'East or north windows, or filtered light through curtains.' },
        { title: 'Low Light', content: 'Plants that can survive away from windows, like snake plants.' },
        { title: 'Rotate Plants', content: 'Rotate pots quarterly for even growth.' }
      ],
      plants: [
        { name: 'Snake Plant', need: 'Low to Bright Indirect', icon: '🌑🌤️' },
        { name: 'Peace Lily', need: 'Medium Indirect', icon: '🌤️' },
        { name: 'Succulents', need: 'Bright Direct', icon: '☀️' },
        { name: 'Monstera', need: 'Bright Indirect', icon: '🌤️' }
      ]
    },
    {
      category: 'Soil & Potting',
      icon: GiFlowerPot,
      color: 'from-amber-500 to-amber-700',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      description: 'Choosing the right soil and pot for your plants',
      tips: [
        { title: 'Well-Draining Soil', content: 'Use potting mix with perlite for most indoor plants.' },
        { title: 'Pot Size', content: 'Choose pots 1-2 inches larger than root ball.' },
        { title: 'Drainage Holes', content: 'Always use pots with drainage holes.' },
        { title: 'Repotting', content: 'Repot every 12-18 months or when roots show.' }
      ],
      plants: [
        { name: 'Succulents', need: 'Cactus mix, sandy' },
        { name: 'Ferns', need: 'Moist, rich soil' },
        { name: 'Peace Lily', need: 'Regular potting mix' },
        { name: 'Orchids', need: 'Bark mix, special' }
      ]
    },
    {
      category: 'Temperature & Humidity',
      icon: FaTemperatureHigh,
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      description: 'Creating the perfect environment',
      tips: [
        { title: 'Ideal Temperature', content: 'Most indoor plants thrive between 65-75°F (18-24°C).' },
        { title: 'Avoid Drafts', content: 'Keep away from AC vents, heaters, and drafty windows.' },
        { title: 'Increase Humidity', content: 'Use pebble trays, group plants, or mist regularly.' },
        { title: 'Watch for Stress', content: 'Brown edges = too dry, yellow leaves = too wet.' }
      ],
      plants: [
        { name: 'Tropical Plants', need: 'High humidity (60%+)' },
        { name: 'Succulents', need: 'Low humidity (30-40%)' },
        { name: 'Ferns', need: 'High humidity (70%+)' },
        { name: 'Snake Plant', need: 'Any humidity' }
      ]
    },
    {
      category: 'Fertilizing',
      icon: FaSeedling, // Changed from GiFertilizer to FaSeedling
      color: 'from-green-400 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      description: 'Feeding your plants for optimal growth',
      tips: [
        { title: 'Growing Season', content: 'Fertilize spring through summer (March-September).' },
        { title: 'Dilute Properly', content: 'Use half-strength fertilizer to prevent burn.' },
        { title: 'Types of Fertilizer', content: 'Balanced (10-10-10) for most, specific for others.' },
        { title: 'Rest Period', content: 'No fertilizer in winter when plants rest.' }
      ],
      plants: [
        { name: 'Snake Plant', need: 'Monthly in summer' },
        { name: 'Peace Lily', need: 'Every 2-3 months' },
        { name: 'Succulents', need: 'Every 2-3 months' },
        { name: 'Monstera', need: 'Monthly in summer' }
      ]
    },
    {
      category: 'Pruning & Maintenance',
      icon: GiGardeningShears,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Keeping your plants healthy and beautiful',
      tips: [
        { title: 'Remove Dead Leaves', content: 'Regularly trim yellow or brown leaves.' },
        { title: 'Clean Leaves', content: 'Wipe dust off leaves monthly for better light absorption.' },
        { title: 'Check for Pests', content: 'Inspect weekly for signs of insects or disease.' },
        { title: 'Shape Plants', content: 'Prune to maintain desired shape and size.' }
      ],
      plants: [
        { name: 'Snake Plant', need: 'Minimal' },
        { name: 'Peace Lily', need: 'Remove spent blooms' },
        { name: 'Monstera', need: 'Regular pruning' },
        { name: 'Pothos', need: 'Trim long vines' }
      ]
    }
  ];

  const quickGuides = [
    { 
      problem: 'Yellow Leaves', 
      solution: 'Usually overwatering. Let soil dry out between waterings.',
      icon: '🍂',
      color: 'bg-yellow-100 text-yellow-800'
    },
    { 
      problem: 'Brown Tips', 
      solution: 'Low humidity or inconsistent watering. Mist regularly or use pebble tray.',
      icon: '🌿',
      color: 'bg-amber-100 text-amber-800'
    },
    { 
      problem: 'Drooping Leaves', 
      solution: 'Usually needs water. Check soil moisture and water thoroughly.',
      icon: '🥀',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      problem: 'Pale Leaves', 
      solution: 'Not enough light. Move to brighter spot, but avoid direct sun.',
      icon: '☀️',
      color: 'bg-yellow-100 text-yellow-800'
    },
    { 
      problem: 'Small Pests', 
      solution: 'Spray with neem oil solution. Isolate affected plant.',
      icon: '🐛',
      color: 'bg-red-100 text-red-800'
    },
    { 
      problem: 'Slow Growth', 
      solution: 'Check light and fertilizer. May need repotting.',
      icon: '🌱',
      color: 'bg-green-100 text-green-800'
    }
  ];

  const plantProfiles = [
    {
      name: 'Snake Plant',
      scientific: 'Sansevieria trifasciata',
      difficulty: 'Easy',
      light: 'Low to Bright Indirect',
      water: 'Every 2-3 weeks',
      humidity: 'Any',
      petFriendly: false,
      airPurifying: true,
      description: 'Nearly unkillable, perfect for beginners. Thrives on neglect.',
      image: 'https://images.unsplash.com/photo-1572688484438-313a6e50c333?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      tips: [
        'Let soil dry completely between waterings',
        'Tolerates low light but grows faster in bright indirect',
        'Propagate by leaf cuttings in water or soil',
        'Toxic to pets - keep away from cats and dogs'
      ]
    },
    {
      name: 'Peace Lily',
      scientific: 'Spathiphyllum',
      difficulty: 'Moderate',
      light: 'Medium Indirect',
      water: 'Weekly',
      humidity: 'High',
      petFriendly: false,
      airPurifying: true,
      description: 'Beautiful white blooms and excellent air purifier.',
      image: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      tips: [
        'Water when leaves droop slightly',
        'Mist regularly for humidity',
        'Remove spent blooms for more flowers',
        'Toxic to pets'
      ]
    },
    {
      name: 'Monstera',
      scientific: 'Monstera deliciosa',
      difficulty: 'Moderate',
      light: 'Bright Indirect',
      water: 'Weekly',
      humidity: 'High',
      petFriendly: false,
      airPurifying: true,
      description: 'Iconic split leaves make a dramatic statement.',
      image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      tips: [
        'Provide moss pole for climbing',
        'Leaves split more in bright light',
        'Wipe leaves to keep them shiny',
        'Toxic to pets'
      ]
    },
    {
      name: 'ZZ Plant',
      scientific: 'Zamioculcas zamiifolia',
      difficulty: 'Very Easy',
      light: 'Low to Bright',
      water: 'Every 3-4 weeks',
      humidity: 'Any',
      petFriendly: false,
      airPurifying: true,
      description: 'Thrives on complete neglect - perfect for offices.',
      image: 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      tips: [
        'Water only when completely dry',
        'Can survive months without water',
        'Tolerates fluorescent light',
        'Toxic to pets'
      ]
    },
    {
      name: 'Succulents',
      scientific: 'Various',
      difficulty: 'Easy',
      light: 'Bright Direct',
      water: 'Every 2-4 weeks',
      humidity: 'Low',
      petFriendly: true,
      airPurifying: false,
      description: 'Drought-tolerant plants in many shapes and colors.',
      image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      tips: [
        'Need bright light to stay compact',
        'Water deeply but infrequently',
        'Use well-draining cactus soil',
        'Most are pet-friendly'
      ]
    },
    {
      name: 'Spider Plant',
      scientific: 'Chlorophytum comosum',
      difficulty: 'Easy',
      light: 'Bright Indirect',
      water: 'Weekly',
      humidity: 'Moderate',
      petFriendly: true,
      airPurifying: true,
      description: 'Produces baby plants and is safe for pets.',
      image: 'https://images.unsplash.com/photo-1593482892290-f54927ae2bb2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      tips: [
        'Brown tips from fluoride in tap water',
        'Propagate babies in water',
        'Safe for pets',
        'Great hanging plant'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Plant care"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-emerald-900/80" />
        </div>
        
        <div className="relative text-center text-white z-10 px-4 max-w-4xl">
          <Link to="/indoor-plants" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <FaArrowLeft className="mr-2" /> Back to Indoor Plants
          </Link>
          <GiPlantRoots className="text-6xl text-green-300 mx-auto mb-4" />
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            Complete Plant Care Guide
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-90">
            Everything you need to know to keep your indoor plants thriving
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {careGuides.map((guide, index) => (
              <a
                key={index}
                href={`#${guide.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors text-sm"
              >
                <guide.icon className="mr-2" /> {guide.category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for plant care tips..."
              className="w-full px-6 py-4 pr-12 border-2 border-green-200 rounded-full focus:outline-none focus:border-green-500 text-lg"
            />
            <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-600 text-xl" />
          </div>
        </div>
      </section>

      {/* Plant Profiles */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title">Popular Plant Profiles</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Detailed care information for our most popular indoor plants
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plantProfiles.map((plant, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48">
                  <img
                    src={plant.image}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    {plant.airPurifying && (
                      <span className="bg-teal-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <FaShieldAlt className="mr-1" size={10} /> Air Purifying
                      </span>
                    )}
                    {plant.petFriendly ? (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <FaPaw className="mr-1" size={10} /> Pet Safe
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <FaPaw className="mr-1" size={10} /> Toxic
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{plant.name}</h3>
                      <p className="text-sm text-gray-500 italic">{plant.scientific}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      plant.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      plant.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {plant.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{plant.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <FaSun className="text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold">{plant.light}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <FaWater className="text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold">{plant.water}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plant.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <FaLeaf className="text-green-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-600">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Care Guides */}
      {careGuides.map((guide, index) => (
        <section
          key={index}
          id={guide.category.toLowerCase().replace(/\s+/g, '-')}
          className={`py-16 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className="container mx-auto px-4">
            <div className={`max-w-4xl mx-auto ${guide.bgColor} rounded-3xl p-8 shadow-lg`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${guide.color} flex items-center justify-center text-white text-2xl`}>
                  <guide.icon />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold text-gray-800">{guide.category}</h2>
                  <p className="text-gray-600">{guide.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Tips */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FaBook className="mr-2 text-green-600" /> Essential Tips
                  </h3>
                  <div className="space-y-4">
                    {guide.tips.map((tip, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-800 mb-1">{tip.title}</h4>
                        <p className="text-gray-600 text-sm">{tip.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plant Recommendations */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <GiPlantRoots className="mr-2 text-green-600" /> Plant Requirements
                  </h3>
                  <div className="space-y-3">
                    {guide.plants.map((plant, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center">
                        <span className="font-medium text-gray-800">{plant.name}</span>
                        <span className={`${guide.textColor} font-semibold text-sm`}>
                          {plant.need || plant.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Quick Problem Solver */}
      <section className="py-16 bg-gradient-to-b from-green-100 to-white">
        <div className="container mx-auto px-4">
          <h2 className="section-title">Quick Problem Solver</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Identify and fix common plant problems
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {quickGuides.map((guide, index) => (
              <div key={index} className={`${guide.color} rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow`}>
                <div className="text-3xl mb-3">{guide.icon}</div>
                <h3 className="font-bold text-lg mb-2">{guide.problem}</h3>
                <p className="text-sm">{guide.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <FaVideo className="text-5xl text-green-600 mx-auto mb-4" />
          <h2 className="section-title">Video Tutorials</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Watch our plant care experts demonstrate proper techniques
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'How to Water Properly', duration: '5:30', thumbnail: 'https://images.unsplash.com/photo-1463320898482-9e4c1d6a3c7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
              { title: 'Repotting 101', duration: '8:15', thumbnail: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
              { title: 'Identifying Pests', duration: '6:45', thumbnail: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }
            ].map((video, index) => (
              <div key={index} className="bg-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative h-32">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <FaVideo className="text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{video.title}</h3>
                  <p className="text-xs text-gray-600">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <FaQuestionCircle className="text-5xl text-green-600 mx-auto mb-4" />
          <h2 className="section-title">Frequently Asked Questions</h2>
          
          <div className="space-y-4 mt-8">
            {[
              { q: 'How often should I water my plants?', a: 'It depends on the plant, season, and environment. Always check soil moisture first - water when the top 1-2 inches are dry.' },
              { q: 'Why are my plant leaves turning yellow?', a: 'Usually overwatering. Let soil dry out more between waterings. Could also be lack of light or nutrients.' },
              { q: 'What plants are safe for pets?', a: 'Spider plants, Boston ferns, parlor palms, and most succulents are pet-safe. Always check before buying.' },
              { q: 'How do I increase humidity?', a: 'Use a pebble tray, group plants together, mist regularly, or use a humidifier.' },
              { q: 'When should I repot my plant?', a: 'When roots grow out of drainage holes, water runs straight through, or plant looks root-bound (usually every 12-18 months).' }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <GiPlantRoots className="text-6xl text-green-200 mx-auto mb-4" />
          <h2 className="font-display text-4xl font-bold mb-4">Need Personalized Advice?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Our plant experts are here to help you with specific questions
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center"
            >
              <FaHeart className="mr-2" /> Contact Our Experts
            </Link>
            <Link
              to="/indoor-plants"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center"
            >
              <GiPlantRoots className="mr-2" /> Browse Plants
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlantCareGuide;