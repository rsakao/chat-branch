import { useState, useRef, useEffect } from 'react'
import { Send, GitBranch, Eye, EyeOff } from 'lucide-react'
import { Conversation, Message } from '@/types'

interface ChatAreaProps {
  conversation?: Conversation
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string) => void
  onCreateBranch: (messageId: string) => void
  onToggleTree: () => void
}

export default function ChatArea({
  conversation,
  messages,
  isLoading,
  onSendMessage,
  onCreateBranch,
  onToggleTree
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim())
      setInputValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  if (!conversation) {
    return (
      <section className="chat-area">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">会話を選択してください</h2>
            <p className="text-gray-600">左のサイドバーから会話を選択するか、新しい会話を作成してください。</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="chat-area">
      <div className="chat-header">
        <h2>{conversation.title}</h2>
        <div className="tree-toggle">
          <button
            className="btn btn--sm btn--secondary"
            onClick={onToggleTree}
          >
            <Eye size={16} />
            ツリー表示切り替え
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">新しい会話を始めましょう</h3>
              <p className="text-gray-600">下のメッセージボックスに質問や話題を入力してください。</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? 'あなた' : 'AI'}
                  </span>
                  {message.role === 'assistant' && (
                    <div className="message-actions">
                      <button
                        className="branch-btn"
                        onClick={() => onCreateBranch(message.id)}
                        title="ここから分岐"
                      >
                        <GitBranch size={14} />
                        分岐
                      </button>
                    </div>
                  )}
                </div>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-header">
                  <span className="message-role">AI</span>
                </div>
                <div className="message-content">
                  <div className="flex items-center gap-2">
                    <div className="loading-spinner"></div>
                    <span>応答を生成中...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="form-control"
            placeholder="メッセージを入力してください..."
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={1}
            style={{ resize: 'none', minHeight: '60px' }}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send size={16} />
            送信
          </button>
        </form>
      </div>
    </section>
  )
} 