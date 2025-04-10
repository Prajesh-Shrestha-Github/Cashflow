import React from 'react';
import { FaRobot, FaUser } from 'react-icons/fa';

const Avatar = ({ type, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center ${
      type === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
    }`}>
      {type === 'ai' ? <FaRobot /> : <FaUser />}
    </div>
  );
};

export default Avatar;