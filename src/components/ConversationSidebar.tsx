import { Plus, Trash2 } from 'lucide-react'
import { Conversation } from '@/types'
import { formatDate, truncateText } from '@/utils/helpers'
import { useState } from 'react'
import DeleteConfirmDialog from './DeleteConfirmDialog'

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSwitchConversation: (conversationId: string) => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => Promise<boolean>
}

export default function ConversationSidebar({
  conversations,
  currentConversationId,
  onSwitchConversation,
  onNewConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null)

  const handleDeleteClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation() // 会話選択をトリガーしないように
    setConversationToDelete(conversation)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (conversationToDelete) {
      const success = await onDeleteConversation(conversationToDelete.id)
      if (success) {
        setDeleteDialogOpen(false)
        setConversationToDelete(null)
      }
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setConversationToDelete(null)
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>会話履歴</h3>
        <button
          className="btn btn--sm btn--outline"
          onClick={onNewConversation}
        >
          <Plus size={16} />
          新規会話
        </button>
      </div>
      
      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>会話がありません</p>
            <p className="text-sm">新規会話を作成してください</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                conversation.id === currentConversationId ? 'active' : ''
              }`}
            >
              <button
                className="conversation-button"
                onClick={() => onSwitchConversation(conversation.id)}
              >
                <div className="conversation-title">
                  {truncateText(conversation.title, 30)}
                </div>
                <div className="conversation-date">
                  {formatDate(conversation.updatedAt)}
                </div>
              </button>
              <button
                className="delete-button"
                onClick={(e) => handleDeleteClick(e, conversation)}
                title="会話を削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
      
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        conversationTitle={conversationToDelete?.title || ''}
      />
    </aside>
  )
} 