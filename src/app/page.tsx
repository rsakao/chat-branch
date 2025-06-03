'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Settings, Plus, GitBranch } from 'lucide-react'
import ConversationSidebar from '@/components/ConversationSidebar'
import ChatArea from '@/components/ChatArea'
import TreeView from '@/components/TreeView'
import SettingsModal from '@/components/SettingsModal'
import { useChat } from '@/hooks/useChat'
import { useConversations } from '@/hooks/useConversations'

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTreeVisible, setIsTreeVisible] = useState(true)
  const [treeMode, setTreeMode] = useState<'auto' | 'simple' | 'advanced'>('auto')
  
  const {
    conversations,
    currentConversationId,
    createConversation,
    switchConversation,
    loadConversations,
    deleteConversation
  } = useConversations()

  const {
    messages,
    allMessages,
    isLoading,
    sendMessage,
    createBranch,
    selectMessage
  } = useChat(currentConversationId)

  const statusRef = useRef<HTMLDivElement>(null)

  // 初回ロード時に会話を取得
  useEffect(() => {
    loadConversations()
  }, [])

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content)
    } catch (error) {
      toast.error('メッセージの送信に失敗しました')
    }
  }

  const handleCreateBranch = async (messageId: string) => {
    try {
      await createBranch(messageId)
      toast.success('新しいブランチを作成しました')
    } catch (error) {
      toast.error('ブランチの作成に失敗しました')
    }
  }

  const handleNewConversation = async () => {
    try {
      await createConversation()
      toast.success('新しい会話を作成しました')
    } catch (error) {
      toast.error('会話の作成に失敗しました')
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const success = await deleteConversation(conversationId)
      if (success) {
        toast.success('会話を削除しました')
        return true
      } else {
        toast.error('会話の削除に失敗しました')
        return false
      }
    } catch (error) {
      toast.error('会話の削除に失敗しました')
      return false
    }
  }

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="app-header">
        <h1>AI分岐チャット</h1>
        <div className="header-controls">
          <div className="status-indicator" ref={statusRef}>
            <span className="status-text">
              {isLoading ? '応答生成中...' : '準備完了'}
            </span>
            {isLoading && <div className="loading-spinner"></div>}
          </div>
          <button 
            className="btn btn--secondary btn--sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={16} />
            設定
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="main-content">
        {/* 左サイドバー: 会話履歴 */}
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSwitchConversation={switchConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* 中央: チャットエリア */}
        <ChatArea
          conversation={currentConversation}
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onCreateBranch={handleCreateBranch}
          onToggleTree={() => setIsTreeVisible(!isTreeVisible)}
        />

        {/* 右サイドバー: ツリー表示 */}
        {isTreeVisible && (
          <TreeView
            conversation={currentConversation ? {
              ...currentConversation,
              messages: allMessages
            } : undefined}
            messages={messages}
            treeMode={treeMode}
            onTreeModeChange={setTreeMode}
            onSelectMessage={selectMessage}
          />
        )}
      </main>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        treeMode={treeMode}
        onTreeModeChange={setTreeMode}
      />
    </div>
  )
}
