import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  FaBox, 
  FaShoppingBag, 
  FaUsers, 
  FaRupeeSign, 
  FaEye,
  FaExclamationTriangle,
  FaSync,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaDownload,
  FaChartLine,
  FaLeaf,
  FaSeedling
} from 'react-icons/fa'; // Removed FaFlower
import { GiPlantRoots, GiFlowerEmblem } from 'react-icons/gi'; // Added GiFlowerEmblem
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader';

// Register ChartJS components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const { 
    products, 
    orders, 
    users, 
    dashboardStats, 
    fetchDashboardStats,
    loading 
  } = useAdmin();

  const [timeframe, setTimeframe] = useState('week');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: [],
    productsByType: {
      flowers: 0,
      plants: 0,
      other: 0
    },
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    },
    monthlyRevenue: [],
    topProducts: []
  });

  // Fetch dashboard data on mount and when timeframe changes
  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  // Process data whenever products, orders, or dashboardStats change
  useEffect(() => {
    if (products && orders && users) {
      processDashboardData();
    }
  }, [products, orders, users, dashboardStats]);

  const processDashboardData = () => {
    try {
      // Calculate products by type
      const flowers = products?.filter(p => p.type === 'flower').length || 0;
      const plants = products?.filter(p => p.type === 'indoor').length || 0;
      const other = products?.filter(p => !p.type || p.type === 'other').length || 0;

      // Calculate orders by status
      const ordersByStatus = {
        pending: orders?.filter(o => o.orderStatus === 'pending').length || 0,
        processing: orders?.filter(o => o.orderStatus === 'processing').length || 0,
        shipped: orders?.filter(o => o.orderStatus === 'shipped').length || 0,
        delivered: orders?.filter(o => o.orderStatus === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.orderStatus === 'cancelled').length || 0
      };

      // Calculate total revenue
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;

      // Find low stock products (less than 10 items)
      const lowStockProducts = products?.filter(p => p.stock < 10)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5) || [];

      // Get top 5 products by sales (if order items exist)
      const productSales = {};
      orders?.forEach(order => {
        order.orderItems?.forEach(item => {
          const productId = item.product?._id || item.productId;
          if (productId) {
            productSales[productId] = (productSales[productId] || 0) + (item.quantity || 0);
          }
        });
      });

      const topProducts = products
        ?.map(p => ({
          ...p,
          salesCount: productSales[p._id] || 0
        }))
        .filter(p => p.salesCount > 0)
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 5) || [];

      // Generate monthly revenue data (last 6 months)
      const monthlyRevenue = generateMonthlyRevenue(orders);

      setStats({
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        totalUsers: users?.length || 0,
        totalRevenue,
        recentOrders: dashboardStats?.recentOrders || orders?.slice(0, 5) || [],
        lowStockProducts,
        productsByType: {
          flowers,
          plants,
          other
        },
        ordersByStatus,
        monthlyRevenue,
        topProducts
      });

    } catch (error) {
      console.error('Error processing dashboard data:', error);
    }
  };

  const generateMonthlyRevenue = (orders) => {
    const months = [];
    const revenues = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      months.push(monthName);

      const monthRevenue = orders?.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === date.getMonth() &&
               orderDate.getFullYear() === date.getFullYear();
      }).reduce((sum, order) => sum + (order.totalPrice || 0), 0) || 0;

      revenues.push(monthRevenue);
    }

    return { months, revenues };
  };

  const chartData = {
    labels: stats.monthlyRevenue.months || [],
    datasets: [
      {
        label: 'Revenue',
        data: stats.monthlyRevenue.revenues || [],
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `₹${context.raw.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString('en-IN');
          }
        }
      }
    }
  };

  const doughnutData = {
    labels: ['Flowers', 'Plants', 'Other'],
    datasets: [
      {
        data: [stats.productsByType.flowers, stats.productsByType.plants, stats.productsByType.other],
        backgroundColor: ['#ec4899', '#22c55e', '#94a3b8'],
        borderWidth: 0
      }
    ]
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalProducts}</h3>
              <div className="flex items-center mt-2 text-sm">
                {/* Changed FaFlower to GiFlowerEmblem */}
                <GiFlowerEmblem className="text-pink-600 mr-1" />
                <span className="text-gray-600 mr-2">{stats.productsByType.flowers} Flowers</span>
                <GiPlantRoots className="text-green-600 mr-1" />
                <span className="text-gray-600">{stats.productsByType.plants} Plants</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <FaBox className="text-2xl text-pink-600" />
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Orders</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalOrders}</h3>
              <div className="flex items-center mt-2 text-sm">
                <span className="text-yellow-600 mr-2">Pending: {stats.ordersByStatus.pending}</span>
                <span className="text-green-600">Delivered: {stats.ordersByStatus.delivered}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FaShoppingBag className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalUsers}</h3>
              <div className="flex items-center mt-2 text-sm">
                <FaUsers className="text-blue-600 mr-1" />
                <span className="text-gray-600">Registered customers</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUsers className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-800 flex items-center">
                <FaRupeeSign className="text-green-600 mr-1" />
                {stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h3>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <FaArrowUp className="mr-1" />
                <span>+12.5% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FaRupeeSign className="text-2xl text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaChartLine className="mr-2 text-pink-600" />
              Revenue Overview
            </h2>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
            </select>
          </div>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Product Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaFilter className="mr-2 text-pink-600" />
            Products by Type
          </h2>
          <div className="h-64">
            <Doughnut data={doughnutData} options={{ cutout: '70%' }} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-pink-600 rounded-full mr-2"></div>
                <span className="text-gray-600">Flowers</span>
              </div>
              <span className="font-semibold">{stats.productsByType.flowers}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                <span className="text-gray-600">Plants</span>
              </div>
              <span className="font-semibold">{stats.productsByType.plants}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Other</span>
              </div>
              <span className="font-semibold">{stats.productsByType.other}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaShoppingBag className="mr-2 text-purple-600" />
              Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-sm text-purple-600 hover:text-purple-700 flex items-center">
              View All <FaEye className="ml-1" />
            </Link>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <FaShoppingBag className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Order #{order._id?.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 flex items-center">
                      <FaRupeeSign className="mr-1" />
                      {order.totalPrice?.toLocaleString('en-IN')}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaExclamationTriangle className="mr-2 text-orange-600" />
              Low Stock Alert
            </h2>
            <Link to="/admin/products" className="text-sm text-orange-600 hover:text-orange-700 flex items-center">
              Manage Stock <FaEye className="ml-1" />
            </Link>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <FaBox className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">All products are well stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {product.type === 'flower' ? (
                      <GiFlowerEmblem className="text-pink-600 mr-3 text-xl" />
                    ) : (
                      <GiPlantRoots className="text-green-600 mr-3 text-xl" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.stock === 0 ? 'bg-red-100 text-red-700' :
                    product.stock < 5 ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaChartLine className="mr-2 text-pink-600" />
          Top Selling Products
        </h2>
        
        {stats.topProducts.length === 0 ? (
          <div className="text-center py-8">
            <FaBox className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sales data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sales</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {product.type === 'flower' ? (
                          <GiFlowerEmblem className="text-pink-600 mr-2" />
                        ) : (
                          <GiPlantRoots className="text-green-600 mr-2" />
                        )}
                        <span className="font-medium text-gray-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{product.type || 'flower'}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 flex items-center">
                      <FaRupeeSign className="mr-1 text-xs" />
                      {product.price?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {product.salesCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-pink-600 flex items-center">
                      <FaRupeeSign className="mr-1" />
                      {(product.price * product.salesCount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;