import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="relative">
        <div className="w-20 h-20 border-pink-200 border-4 rounded-full"></div>
        <div className="w-20 h-20 border-pink-600 border-t-4 animate-spin rounded-full absolute left-0 top-0"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🌸</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;