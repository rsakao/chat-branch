import { useState, useRef, useEffect } from 'react'
import { Send, GitBranch, Eye, EyeOff, Quote, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Conversation, Message } from '@/types'

interface ChatAreaProps {
  conversation?: Conversation
  messages: Message[]
  isLoading: boolean
  onSendMessage: (content: string, branchFromMessageId?: string, quotedMessage?: Message, quotedText?: string) => void
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
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null)
  const [quotedText, setQuotedText] = useState<string>('')
  const [selectedText, setSelectedText] = useState<string>('')
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
      onSendMessage(inputValue.trim(), quotedMessage?.id, quotedMessage || undefined, quotedText || undefined)
      setInputValue('')
      setQuotedMessage(null)
      setQuotedText('')
      setSelectedText('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
    } else {
      setSelectedText('')
    }
  }

  const handleQuoteSelection = (message: Message) => {
    if (selectedText) {
      setQuotedMessage(message)
      setQuotedText(selectedText)
      setSelectedText('')
      textareaRef.current?.focus()
    }
  }

  const handleMessageClick = (message: Message) => {
    if (message.role === 'assistant' && !selectedText) {
      setQuotedMessage(message)
      setQuotedText(message.content)
      textareaRef.current?.focus()
    }
  }

  const handleClearQuote = () => {
    setQuotedMessage(null)
    setQuotedText('')
    setSelectedText('')
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
              <div 
                key={message.id} 
                className={`message ${message.role} ${message.role === 'assistant' ? 'clickable' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? 'あなた' : 'AI'}
                  </span>
                  {message.role === 'assistant' && (
                    <div className="message-actions">
                      {selectedText && (
                        <button
                          className="quote-selected-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleQuoteSelection(message)
                          }}
                          title="選択したテキストを引用"
                        >
                          <Quote size={14} />
                          選択部分を引用
                        </button>
                      )}
                      <button
                        className="quote-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMessageClick(message)
                        }}
                        title="このメッセージ全体を引用"
                      >
                        <Quote size={14} />
                        全体を引用
                      </button>
                      <button
                        className="branch-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateBranch(message.id)
                        }}
                        title="ここから分岐"
                      >
                        <GitBranch size={14} />
                        分岐
                      </button>
                    </div>
                  )}
                </div>
                <div 
                  className="message-content"
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // カスタムコンポーネントの設定
                        p: ({ children }) => <p className="markdown-paragraph">{children}</p>,
                        h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
                        h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
                        h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
                        h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
                        h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
                        h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,
                        ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
                        ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
                        li: ({ children }) => <li className="markdown-li">{children}</li>,
                        blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
                        hr: () => <hr className="markdown-hr" />,
                        code: ({ children, className, ...props }) => {
                          // インラインコードとコードブロックを区別
                          const match = /language-(\w+)/.exec(className || '')
                          const language = match ? match[1] : ''
                          
                          if (className?.startsWith('language-')) {
                            return <code className={`markdown-code-block ${className}`} {...props}>{children}</code>
                          }
                          return <code className="markdown-code-inline" {...props}>{children}</code>
                        },
                        pre: ({ children, ...props }) => (
                          <pre className="markdown-pre" {...props}>
                            {children}
                          </pre>
                        ),
                        table: ({ children }) => <table className="markdown-table">{children}</table>,
                        thead: ({ children }) => <thead className="markdown-thead">{children}</thead>,
                        tbody: ({ children }) => <tbody className="markdown-tbody">{children}</tbody>,
                        tr: ({ children }) => <tr className="markdown-tr">{children}</tr>,
                        th: ({ children }) => <th className="markdown-th">{children}</th>,
                        td: ({ children }) => <td className="markdown-td">{children}</td>,
                        a: ({ children, href, ...props }) => (
                          <a 
                            href={href} 
                            className="markdown-link" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            {...props}
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
                        em: ({ children }) => <em className="markdown-em">{children}</em>,
                        input: ({ type, checked, ...props }) => {
                          // チェックボックス用
                          if (type === 'checkbox') {
                            return (
                              <input 
                                type="checkbox" 
                                checked={checked}
                                readOnly
                                className="markdown-checkbox"
                                {...props}
                              />
                            )
                          }
                          return <input type={type} {...props} />
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
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
        {quotedMessage && quotedText && (
          <div className="quoted-message">
            <div className="quoted-message-header">
              <Quote size={16} />
              <span>引用メッセージ</span>
              <button
                className="clear-quote-btn"
                onClick={handleClearQuote}
                title="引用を削除"
              >
                <X size={16} />
              </button>
            </div>
            <div className="quoted-message-content">
              {quotedText.slice(0, 200)}
              {quotedText.length > 200 && '...'}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="form-control"
            placeholder={quotedMessage ? "引用メッセージに対する返信を入力してください..." : "メッセージを入力してください..."}
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