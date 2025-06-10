'use client';

import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface AlertProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Alert({ 
  type, 
  title, 
  message, 
  onClose, 
  autoClose = true,
  autoCloseDelay = 5000 
}: AlertProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <FaCheckCircle className="w-5 h-5 text-green-600" />,
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <FaExclamationCircle className="w-5 h-5 text-red-600" />,
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <FaInfoCircle className="w-5 h-5 text-blue-600" />,
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  };

  const style = styles[type];

  return (
    <div className={`fixed top-4 right-4 max-w-md w-full ${style.bg} ${style.border} border rounded-lg shadow-lg p-4 z-50 animate-slide-in`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${style.titleColor}`}>
            {title}
          </h3>
          <div className={`mt-1 text-sm ${style.messageColor}`}>
            {message}
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md ${style.bg} p-1.5 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600`}
          >
            <FaTimes className={`h-4 w-4 ${style.titleColor}`} />
          </button>
        </div>
      </div>
    </div>
  );
}