'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Settings, GitBranch, Menu } from 'lucide-react'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isTreeOpen, setIsTreeOpen] = useState(false)
  
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

  // モバイルでサイドバーやツリーが開いている時のbodyスクロール制御
  useEffect(() => {
    const isMobile = window.innerWidth <= 768
    if (isMobile && (isSidebarOpen || isTreeOpen)) {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }

    // クリーンアップ
    return () => {
      document.body.classList.remove('no-scroll')
    }
  }, [isSidebarOpen, isTreeOpen])

  const handleSendMessage = async (
    content: string, 
    quotedMessageId?: string, 
    quotedMessage?: { role: string; content: string }, 
    quotedText?: string
  ) => {
    try {
      if (quotedMessageId) {
        // 引用メッセージから分岐を作成してメッセージを送信
        await sendMessage(content, quotedMessageId, quotedMessage, quotedText)
        toast.success('新しいブランチを作成しました')
      } else {
        await sendMessage(content, undefined, quotedMessage, quotedText)
      }
    } catch {
      toast.error('メッセージの送信に失敗しました')
    }
  }

  const handleCreateBranch = async (messageId: string) => {
    try {
      await createBranch(messageId)
      toast.success('新しいブランチを作成しました')
    } catch {
      toast.error('ブランチの作成に失敗しました')
    }
  }

  const handleNewConversation = async () => {
    try {
      await createConversation()
      toast.success('新しい会話を作成しました')
    } catch {
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
    } catch {
      toast.error('会話の削除に失敗しました')
      return false
    }
  }

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="app-header">
        <div className="header-left">
          <button 
            className={`mobile-nav-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen)
              if (!isSidebarOpen) setIsTreeOpen(false) // サイドバーを開く時はツリーを閉じる
            }}
            aria-label="会話履歴を開く"
          >
            <Menu size={20} />
          </button>
          <h1>AI分岐チャット</h1>
        </div>
        <div className="header-controls">
          <div className="status-indicator" ref={statusRef}>
            <span className="status-text">
              {isLoading ? '応答生成中...' : '準備完了'}
            </span>
            {isLoading && <div className="loading-spinner"></div>}
          </div>
          <button 
            className={`mobile-nav-btn ${isTreeOpen ? 'active' : ''}`}
            onClick={() => {
              setIsTreeOpen(!isTreeOpen)
              if (!isTreeOpen) setIsSidebarOpen(false) // ツリーを開く時はサイドバーを閉じる
            }}
            aria-label="会話ツリーを開く"
          >
            <GitBranch size={20} />
          </button>
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
        {/* オーバーレイ */}
        {(isSidebarOpen || isTreeOpen) && (
          <div 
            className={`sidebar-overlay ${isSidebarOpen || isTreeOpen ? 'open' : ''}`}
            onClick={() => {
              if (isSidebarOpen) setIsSidebarOpen(false)
              if (isTreeOpen) setIsTreeOpen(false)
            }}
          />
        )}

        {/* 左サイドバー: 会話履歴 */}
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSwitchConversation={(id) => {
            switchConversation(id)
            setIsSidebarOpen(false)
          }}
          onNewConversation={() => {
            handleNewConversation()
            setIsSidebarOpen(false)
          }}
          onDeleteConversation={handleDeleteConversation}
          className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
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
            onSelectMessage={(messageId) => {
              selectMessage(messageId)
              setIsTreeOpen(false)
            }}
            className={`tree-area ${isTreeOpen ? 'open' : ''}`}
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
