import React from 'react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  conversationTitle: string
}

export default function DeleteConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conversationTitle 
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>会話を削除</h3>
        </div>
        
        <div className="modal-body">
          <p>「{conversationTitle}」を削除してもよろしいですか？</p>
          <p className="warning-text">この操作は元に戻せません。</p>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
          >
            キャンセル
          </button>
          <button 
            className="btn btn-danger" 
            onClick={onConfirm}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}