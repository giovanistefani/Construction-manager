'use client';

import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    showCancel: false
  });

  const showModal = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options?: {
      onConfirm?: () => void;
      confirmText?: string;
      cancelText?: string;
      showCancel?: boolean;
    }
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: options?.onConfirm,
      confirmText: options?.confirmText || 'OK',
      cancelText: options?.cancelText || 'Cancelar',
      showCancel: options?.showCancel || false
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Métodos de conveniência
  const showSuccess = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal(title, message, 'success', { onConfirm });
  }, [showModal]);

  const showError = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal(title, message, 'error', { onConfirm });
  }, [showModal]);

  const showWarning = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal(title, message, 'warning', { onConfirm });
  }, [showModal]);

  const showInfo = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showModal(title, message, 'info', { onConfirm });
  }, [showModal]);

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    showModal(title, message, 'warning', { 
      onConfirm, 
      confirmText, 
      cancelText, 
      showCancel: true 
    });
  }, [showModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};