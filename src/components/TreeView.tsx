import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
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
  // リサイズ機能
  const [treeWidth, setTreeWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const treeRef = useRef<HTMLDivElement>(null);

  // メッセージ数に基づいて使用するモードを決定
  const useAdvanced = useMemo(() => {
    if (!conversation) return false;
    
    if (treeMode === 'advanced') return true;
    if (treeMode === 'simple') return false;
    
    // auto modeの場合
    const messageCount = Object.keys(conversation.messages || {}).length;
    return messageCount > 10;
  }, [treeMode, conversation]);

  // リサイズ処理
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // マウスX座標から左端までの距離を計算
      const mainContentElement = document.querySelector('.main-content');
      if (!mainContentElement) return;
      
      const mainContentRect = mainContentElement.getBoundingClientRect();
      const availableWidth = mainContentRect.width;
      
      // 画面右端からマウスまでの距離を計算
      const distanceFromRight = availableWidth - (e.clientX - mainContentRect.left);
      const newWidth = Math.max(250, Math.min(800, distanceFromRight));
      
      setTreeWidth(newWidth);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', stopResizing);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);


  if (!conversation) {
    return (
      <aside className="tree-area" style={{ width: `${treeWidth}px` }}>
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
              <option value="advanced">グラフィカル表示</option>
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

  return (
    <>
      {/* リサイズハンドル */}
      <div 
        className="resize-handle"
        onMouseDown={startResizing}
        style={{ 
          left: `calc(100% - ${treeWidth}px - 3px)`,
          background: isResizing ? 'rgba(0, 0, 0, 0.2)' : undefined
        }}
      />
      <aside 
        className="tree-area" 
        ref={treeRef}
        style={{ width: `${treeWidth}px` }}
      >
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
              <option value="advanced">グラフィカル表示</option>
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
    </>
  )
}

interface SimpleTreeProps {
  messages: Record<string, Message>
  currentMessages: Message[]
  onSelectMessage: (messageId: string) => void
}

const SimpleTree: React.FC<SimpleTreeProps> = ({ messages, currentMessages, onSelectMessage }) => {
  // メモ化された現在のメッセージIDセット
  const currentMessageIds = useMemo(() => 
    new Set(currentMessages.map(m => m.id)),
    [currentMessages]
  );

  // メモ化されたツリー構造のレンダリング関数
  const renderTree = useMemo(() => {
    // ノードをレンダリングする関数
    const renderNode = (messageId: string, depth = 0): JSX.Element | null => {
      const message = messages[messageId];
      if (!message) return null;
      
      const isActive = currentMessageIds.has(messageId);
      const indent = depth * 20;
      
      return (
        <div key={`node-${messageId}`} className="node-container">
          <div
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
          
          {/* 子ノード */}
          {message.children && message.children.length > 0 && (
            <div className="children-container">
              {message.children.map(childId => 
                renderNode(childId, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    };
    
    // ルートメッセージを見つける
    const rootMessages = Object.values(messages).filter(m => !m.parentId);
    
    return (
      <>
        {rootMessages.map(rootMessage => 
          renderNode(rootMessage.id, 0)
        )}
      </>
    );
  }, [messages, currentMessageIds, onSelectMessage]);
  
  return (
    <div className="simple-tree-container">
      {renderTree}
    </div>
  );
}