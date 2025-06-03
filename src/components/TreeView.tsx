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
  
  // 幅の監視用
  const [componentWidth, setComponentWidth] = useState(350);
  
  // デバッグモードの設定を読み込む
  const [debugMode, setDebugMode] = useState(false);
  
  useEffect(() => {
    // localStorageから設定を読み込む
    const saved = localStorage.getItem('chatAppSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.debugMode !== undefined) {
          setDebugMode(settings.debugMode);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // コンポーネントの幅を監視
  useEffect(() => {
    const observeWidth = () => {
      if (treeRef.current) {
        const width = treeRef.current.offsetWidth;
        setComponentWidth(width);
      }
    };

    // 初期値を設定
    observeWidth();

    // ResizeObserverで監視
    const resizeObserver = new ResizeObserver(observeWidth);
    if (treeRef.current) {
      resizeObserver.observe(treeRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [treeWidth]);

  // ツリーの表示方法を決定
  const { useAdvanced, treeMaxWidth } = useMemo(() => {
    if (!conversation) return { useAdvanced: false, treeMaxWidth: 0 };
    
    if (treeMode === 'advanced') return { useAdvanced: true, treeMaxWidth: 0 };
    if (treeMode === 'simple') return { useAdvanced: false, treeMaxWidth: 0 };
    
    // auto modeの場合、コンポーネントの幅で判定
    const messages = conversation.messages || {};
    
    // ツリーの最大幅を計算（デバッグ表示用）
    const calculateTreeWidth = () => {
      // 各レベル（深さ）にあるノードの数を記録
      const levelCounts = new Map<number, number>();
      
      // 深さを計算する再帰関数
      const calculateDepth = (messageId: string, depth = 0) => {
        // 現在の深さのカウントを更新
        levelCounts.set(depth, (levelCounts.get(depth) || 0) + 1);
        
        // 子ノードについても同様に計算
        const message = messages[messageId];
        if (message?.children && message.children.length > 0) {
          message.children.forEach(childId => {
            calculateDepth(childId, depth + 1);
          });
        }
      };
      
      // ルートメッセージから計算開始
      Object.values(messages).forEach(message => {
        if (!message.parentId) {
          calculateDepth(message.id);
        }
      });
      
      // 最大幅を返す
      return Math.max(...Array.from(levelCounts.values(), count => count || 0), 0);
    };
    
    // ツリーの最大幅（デバッグ用）
    const maxTreeWidth = calculateTreeWidth();
    
    // コンポーネントの幅で表示方法を決定（400px未満の場合はシンプル表示）
    const useAdvancedDisplay = componentWidth >= 400;
    
    return { 
      useAdvanced: useAdvancedDisplay,
      treeMaxWidth: maxTreeWidth
    };
  }, [treeMode, conversation, componentWidth]);

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
          {debugMode && conversation && (
            <div className="debug-info" style={{ 
              fontSize: '11px', 
              marginTop: '5px', 
              color: '#666',
              backgroundColor: '#f0f0f0',
              padding: '3px 6px',
              borderRadius: '4px'
            }}>
              幅: {componentWidth}px ({componentWidth >= 400 ? 'グラフィカル' : 'シンプル'}) | ツリー最大幅: {treeMaxWidth}
            </div>
          )}
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

// 会話ペアを表現するインターface（SimpleTree用）
interface SimpleConversationPair {
  id: string
  userMessage: Message
  aiMessage?: Message
  children: string[] // 次の会話ペアのID
  level: number
}

const SimpleTree: React.FC<SimpleTreeProps> = ({ messages, currentMessages, onSelectMessage }) => {
  // メモ化された現在のメッセージIDセット
  const currentMessageIds = useMemo(() => 
    new Set(currentMessages.map(m => m.id)),
    [currentMessages]
  );

  // 会話ペアを作成する関数（SimpleTree用）
  const createSimpleConversationPairs = useCallback((messages: Record<string, Message>) => {
    const pairs: Record<string, SimpleConversationPair> = {};
    const processedMessages = new Set<string>();
    
    // ユーザーメッセージから会話ペアを作成
    const userMessages = Object.values(messages).filter(m => m.role === 'user');
    
    userMessages.forEach(userMsg => {
      if (processedMessages.has(userMsg.id)) return;
      
      // 対応するAIメッセージを探す
      const aiMessage = userMsg.children
        ?.map(childId => messages[childId])
        .find(child => child?.role === 'assistant');
      
      const pairId = `pair-${userMsg.id}`;
      
      // 分岐は常にAIメッセージの子から発生
      const children: string[] = [];
      if (aiMessage?.children) {
        aiMessage.children.forEach(childId => {
          const childMsg = messages[childId];
          if (childMsg?.role === 'user') {
            children.push(`pair-${childId}`);
          }
        });
      }
      
      // レベル計算（ユーザーメッセージの親から判定）
      let level = 0;
      if (userMsg.parentId) {
        const parentMsg = messages[userMsg.parentId];
        if (parentMsg?.role === 'assistant') {
          // 親のAIメッセージに対応するユーザーメッセージを探す
          const grandParentUserMsg = Object.values(messages).find(m => 
            m.role === 'user' && m.children?.includes(parentMsg.id)
          );
          if (grandParentUserMsg) {
            const parentPair = pairs[`pair-${grandParentUserMsg.id}`];
            level = (parentPair?.level || 0) + 1;
          }
        }
      }
      
      pairs[pairId] = {
        id: pairId,
        userMessage: userMsg,
        aiMessage,
        children,
        level
      };
      
      processedMessages.add(userMsg.id);
      if (aiMessage) {
        processedMessages.add(aiMessage.id);
      }
    });
    
    return pairs;
  }, []);

  // メモ化されたツリー構造のレンダリング関数
  const renderTree = useMemo(() => {
    const pairs = createSimpleConversationPairs(messages);
    
    // ペアをレンダリングする関数
    const renderPair = (pairId: string, depth = 0): JSX.Element | null => {
      const pair = pairs[pairId];
      if (!pair) return null;
      
      const isActive = currentMessageIds.has(pair.userMessage.id) || 
                      (pair.aiMessage && currentMessageIds.has(pair.aiMessage.id));
      const indent = depth * 20;
      
      const handleClick = () => {
        // AIメッセージがあればそれを、なければユーザーメッセージを選択
        const targetMessageId = pair.aiMessage ? pair.aiMessage.id : pair.userMessage.id;
        onSelectMessage(targetMessageId);
      };
      
      return (
        <div key={`pair-${pairId}`} className="node-container">
          <div
            className={`tree-node conversation-pair ${isActive ? 'active' : ''}`}
            style={{ marginLeft: `${indent}px` }}
            onClick={handleClick}
          >
            {/* ユーザーメッセージ部分 */}
            <div className="pair-user-message">
              <span className="tree-node-prefix">👤</span>
              <span className="tree-node-content">
                {truncateText(pair.userMessage.content, 35)}
              </span>
            </div>
            
            {/* AIメッセージ部分 */}
            {pair.aiMessage && (
              <div className="pair-ai-message">
                <span className="tree-node-prefix">🤖</span>
                <span className="tree-node-content">
                  {truncateText(pair.aiMessage.content, 35)}
                </span>
              </div>
            )}
          </div>
          
          {/* 子ペア */}
          {pair.children && pair.children.length > 0 && (
            <div className="children-container">
              {pair.children.map(childPairId => 
                renderPair(childPairId, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    };
    
    // ルートペア（レベル0）を見つける
    const rootPairs = Object.values(pairs).filter(p => p.level === 0);
    
    return (
      <>
        {rootPairs.map(rootPair => 
          renderPair(rootPair.id, 0)
        )}
      </>
    );
  }, [messages, currentMessageIds, onSelectMessage, createSimpleConversationPairs]);
  
  return (
    <div className="simple-tree-container">
      {renderTree}
    </div>
  );
}