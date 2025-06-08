import React from 'react';
import { useTranslations } from 'next-intl';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conversationTitle: string;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  conversationTitle,
}: DeleteConfirmDialogProps) {
  const t = useTranslations('delete');
  
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{t('confirmTitle')}</h3>
        </div>

        <div className="modal-body">
          <p>{t('confirmMessage')}</p>
          <p><strong>{t('conversationTitle', { title: conversationTitle })}</strong></p>
          <p className="warning-text">{t('thisActionCannotBeUndone')}</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
