import { Plus } from 'lucide-react'
import { Conversation } from '@/types'
import { formatDate, truncateText } from '@/utils/helpers'

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSwitchConversation: (conversationId: string) => void
  onNewConversation: () => void
}

export default function ConversationSidebar({
  conversations,
  currentConversationId,
  onSwitchConversation,
  onNewConversation
}: ConversationSidebarProps) {
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
            <button
              key={conversation.id}
              className={`conversation-item ${
                conversation.id === currentConversationId ? 'active' : ''
              }`}
              onClick={() => onSwitchConversation(conversation.id)}
            >
              <div className="conversation-title">
                {truncateText(conversation.title, 30)}
              </div>
              <div className="conversation-date">
                {formatDate(conversation.updatedAt)}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
} 