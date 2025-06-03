import { useState, useEffect } from 'react'
import { Conversation, Message } from '@/types'
import { truncateText } from '@/utils/helpers'
import ReactFlowTree from './ReactFlowTree'

interface TreeViewProps {
  conversation?: Conversation
  messages: Message[]
  treeMode: 'auto' | 'simple' | 'advanced'
  onTreeModeChange: (mode: 'auto' | 'simple' | 'advanced') => void
  onSelectMessage: (messageId: string) => void
}

export default function TreeView({
  conversation,
  messages,
  treeMode,
  onTreeModeChange,
  onSelectMessage
}: TreeViewProps) {
  const [useAdvanced, setUseAdvanced] = useState(false)

  useEffect(() => {
    if (treeMode === 'advanced') {
      setUseAdvanced(true)
    } else if (treeMode === 'simple') {
      setUseAdvanced(false)
    } else {
      // auto mode: use advanced for complex trees
      const messageCount = Object.keys(conversation?.messages || {}).length
      setUseAdvanced(messageCount > 10)
    }
  }, [treeMode, conversation])

  if (!conversation) {
    return (
      <aside className="tree-area">
        <div className="tree-header">
          <h3>会話ツリー</h3>
          <div className="tree-mode-selector">
            <select
              value={treeMode}
              onChange={(e) => onTreeModeChange(e.target.value as any)}
              className="form-control"
            >
              <option value="auto">自動選択</option>
              <option value="simple">シンプル表示</option>
              <option value="advanced">高度表示</option>
            </select>
          </div>
        </div>
        <div className="tree-container">
          <div className="tree-loading">
            <p>会話を選択してください</p>
          </div>
        </div>
      </aside>
    )
  }

  const allMessages = conversation?.messages || {}

  const buildSimpleTree = () => {
    const buildNodeHTML = (messageId: string, depth = 0): string => {
      const message = allMessages[messageId]
      if (!message) return ''

      const isActive = messages.some(m => m.id === messageId)
      const indent = '  '.repeat(depth)
      const prefix = message.role === 'user' ? '👤' : '🤖'
      const content = truncateText(message.content, 30)
      
      let html = `${indent}${prefix} ${content}\n`
      
      if (message.children) {
        message.children.forEach(childId => {
          html += buildNodeHTML(childId, depth + 1)
        })
      }
      
      return html
    }

    // Find root messages
    const rootMessages = Object.values(allMessages).filter(m => !m.parentId)
    let treeHTML = ''
    
    rootMessages.forEach(rootMessage => {
      treeHTML += buildNodeHTML(rootMessage.id)
    })
    
    return treeHTML
  }

  return (
    <aside className="tree-area">
      <div className="tree-header">
        <h3>会話ツリー</h3>
        <div className="tree-mode-selector">
          <select
            value={treeMode}
            onChange={(e) => onTreeModeChange(e.target.value as any)}
            className="form-control"
          >
            <option value="auto">自動選択</option>
            <option value="simple">シンプル表示</option>
            <option value="advanced">高度表示</option>
          </select>
        </div>
      </div>

      <div className="tree-container">
        {useAdvanced ? (
          <ReactFlowTree
            messages={allMessages}
            currentMessages={messages}
            onSelectMessage={onSelectMessage}
          />
        ) : (
          <div className="simple-tree">
            {Object.keys(allMessages).length === 0 ? (
              <div className="tree-loading">
                <p>メッセージがありません</p>
              </div>
            ) : (
              <SimpleTree
                messages={allMessages}
                currentMessages={messages}
                onSelectMessage={onSelectMessage}
              />
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

interface SimpleTreeProps {
  messages: Record<string, Message>
  currentMessages: Message[]
  onSelectMessage: (messageId: string) => void
}

function SimpleTree({ messages, currentMessages, onSelectMessage }: SimpleTreeProps) {
  const currentMessageIds = new Set(currentMessages.map(m => m.id))

  const buildTree = (messageId: string, depth = 0): JSX.Element[] => {
    const message = messages[messageId]
    if (!message) return []

    const isActive = currentMessageIds.has(messageId)
    const indent = depth * 20

    const elements: JSX.Element[] = [
      <div
        key={messageId}
        className={`tree-node ${message.role} ${isActive ? 'active' : ''}`}
        style={{ marginLeft: `${indent}px` }}
        onClick={() => onSelectMessage(messageId)}
      >
        <span className="tree-node-prefix">
          {message.role === 'user' ? '👤' : '🤖'}
        </span>
        <span className="tree-node-content">
          {truncateText(message.content, 40)}
        </span>
      </div>
    ]

    if (message.children) {
      message.children.forEach(childId => {
        elements.push(...buildTree(childId, depth + 1))
      })
    }

    return elements
  }

  // Find root messages
  const rootMessages = Object.values(messages).filter(m => !m.parentId)
  
  return (
    <div className="simple-tree-container">
      {rootMessages.map(rootMessage => 
        buildTree(rootMessage.id).map(element => element)
      )}
    </div>
  )
} 