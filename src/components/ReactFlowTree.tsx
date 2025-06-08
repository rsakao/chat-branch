import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Message } from '@/types';
import { truncateText } from '@/utils/helpers';

interface ReactFlowTreeProps {
  messages: Record<string, Message>;
  currentMessages: Message[];
  onSelectMessage: (messageId: string) => void;
}

// 会話ペア（ユーザー+AI）を表現するインターface
interface ConversationPair {
  id: string;
  userMessage: Message;
  aiMessage?: Message;
  children: string[]; // 次の会話ペアのID
  level: number;
}

// ノードタイプを判定する関数
const getNodeType = (
  pairId: string,
  pairs: Record<string, ConversationPair>
): 'root' | 'branch' | 'leaf' => {
  const pair = pairs[pairId];
  if (!pair) return 'leaf';

  // レベル0の場合はルート
  if (pair.level === 0) return 'root';

  // 子がない場合はリーフ
  if (!pair.children || pair.children.length === 0) return 'leaf';

  // それ以外はブランチ
  return 'branch';
};

// ノードタイプ別のスタイル
const getNodeStyle = (
  nodeType: 'root' | 'branch' | 'leaf',
  isActive: boolean
) => {
  const baseStyle = {
    width: 180,
    height: 120,
    border: 'none',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const styles = {
    root: {
      ...baseStyle,
      background: isActive ? '#2563eb' : '#3b82f6',
      color: 'white',
    },
    branch: {
      ...baseStyle,
      background: isActive ? '#d97706' : '#f59e0b',
      color: 'white',
    },
    leaf: {
      ...baseStyle,
      background: isActive ? '#059669' : '#10b981',
      color: 'white',
    },
  };

  return styles[nodeType];
};

export default function ReactFlowTree({
  messages,
  currentMessages,
  onSelectMessage,
}: ReactFlowTreeProps) {
  // キーを使用して強制的に再レンダリング
  const [, forceUpdate] = useState(0);

  // テーマ検出（アプリ設定を優先）
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      // アプリの明示的な設定を確認
      const explicitTheme =
        document.documentElement.getAttribute('data-color-scheme');
      if (explicitTheme) {
        setIsDarkMode(explicitTheme === 'dark');
      } else {
        // 明示的な設定がない場合のみシステム設定を使用
        const isDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        setIsDarkMode(isDark);
      }
    };

    checkDarkMode();

    // data-color-scheme属性の変更を監視
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-scheme'],
    });

    // システムのprefers-color-scheme変更も監視（明示的設定がない場合用）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // 現在選択されているメッセージのIDセット
  const currentMessageIds = useMemo(
    () => new Set(currentMessages.map((m) => m.id)),
    [currentMessages]
  );

  // 会話ペアを作成する関数
  const createConversationPairs = (messages: Record<string, Message>) => {
    const pairs: Record<string, ConversationPair> = {};
    const processedMessages = new Set<string>();

    // ユーザーメッセージから会話ペアを作成
    const userMessages = Object.values(messages).filter(
      (m) => m.role === 'user'
    );

    userMessages.forEach((userMsg) => {
      if (processedMessages.has(userMsg.id)) return;

      // 対応するAIメッセージを探す
      const aiMessage = userMsg.children
        ?.map((childId) => messages[childId])
        .find((child) => child?.role === 'assistant');

      const pairId = `pair-${userMsg.id}`;

      // 分岐は常にAIメッセージの子から発生
      const children: string[] = [];
      if (aiMessage?.children) {
        aiMessage.children.forEach((childId) => {
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
          const grandParentUserMsg = Object.values(messages).find(
            (m) => m.role === 'user' && m.children?.includes(parentMsg.id)
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
        level,
      };

      processedMessages.add(userMsg.id);
      if (aiMessage) {
        processedMessages.add(aiMessage.id);
      }
    });

    return pairs;
  };

  // 新しいノードとエッジを計算
  const nodesAndEdges = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 会話ペアを作成
    const pairs = createConversationPairs(messages);

    // レベル別にペアを整理
    const levelPairs = new Map<number, string[]>();
    Object.values(pairs).forEach((pair) => {
      if (!levelPairs.has(pair.level)) {
        levelPairs.set(pair.level, []);
      }
      levelPairs.get(pair.level)!.push(pair.id);
    });

    // ノード作成（会話ペア単位）
    Object.entries(pairs).forEach(([pairId, pair]) => {
      const pairsAtLevel = levelPairs.get(pair.level) || [];
      const indexAtLevel = pairsAtLevel.indexOf(pairId);

      // 水平間隔を調整
      const horizontalSpacing = 300;
      const verticalSpacing = 180;
      const centerOffset = ((pairsAtLevel.length - 1) * horizontalSpacing) / 2;

      const x = indexAtLevel * horizontalSpacing - centerOffset;
      const y = pair.level * verticalSpacing;

      const nodeType = getNodeType(pairId, pairs);
      const isActive =
        currentMessageIds.has(pair.userMessage.id) ||
        (pair.aiMessage ? currentMessageIds.has(pair.aiMessage.id) : false);

      nodes.push({
        id: pairId,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {/* ユーザーメッセージ部分 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    marginRight: '6px',
                    fontWeight: 'bold',
                  }}
                >
                  👤
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    lineHeight: '1.2',
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  {truncateText(pair.userMessage.content, 15)}
                </div>
              </div>

              {/* AIメッセージ部分 */}
              {pair.aiMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      marginRight: '6px',
                      fontWeight: 'bold',
                    }}
                  >
                    🤖
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      lineHeight: '1.2',
                      textAlign: 'left',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {truncateText(pair.aiMessage.content, 15)}
                  </div>
                </div>
              )}
            </div>
          ),
        },
        style: getNodeStyle(nodeType, isActive),
      });
    });

    // エッジ作成（会話ペア間の接続）
    Object.entries(pairs).forEach(([pairId, pair]) => {
      if (pair.children && pair.children.length > 0) {
        pair.children.forEach((childPairId) => {
          edges.push({
            id: `${pairId}-${childPairId}`,
            source: pairId,
            target: childPairId,
            type: 'smoothstep',
            style: {
              stroke: isDarkMode ? '#94a3b8' : '#64748b',
              strokeWidth: 3,
              strokeDasharray: '8 4',
              animation: 'flow 2s linear infinite reverse',
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 10,
              height: 10,
              color: isDarkMode ? '#94a3b8' : '#64748b',
            },
          });
        });
      }
    });

    return { nodes, edges };
  }, [messages, currentMessageIds, isDarkMode]);

  // メッセージが変わったときに強制再レンダリング
  React.useEffect(() => {
    forceUpdate((prev) => prev + 1);
  }, [messages, currentMessages]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // ペアIDからAIメッセージのIDを取得（ユーザー+AI対話の最後まで表示）
      const pairId = node.id;
      const pairs = createConversationPairs(messages);
      const pair = pairs[pairId];
      if (pair) {
        // AIメッセージがあればそれを、なければユーザーメッセージを選択
        const targetMessageId = pair.aiMessage
          ? pair.aiMessage.id
          : pair.userMessage.id;
        onSelectMessage(targetMessageId);
      }
    },
    [onSelectMessage, messages]
  );

  const backgroundStyle = isDarkMode ? '#1e293b' : '#f8fafc';
  const backgroundGridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const legendBg = isDarkMode ? '#334155' : 'white';
  const legendTextColor = isDarkMode ? '#f1f5f9' : '#1e293b';
  const legendShadow = isDarkMode
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)';

  return (
    <div style={{ height: '100%', width: '100%', background: backgroundStyle }}>
      <ReactFlow
        nodes={nodesAndEdges.nodes}
        edges={nodesAndEdges.edges}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ background: backgroundStyle }}
        key={Object.keys(messages).length} // キーを使って強制的に再レンダリング
      >
        <Background color={backgroundGridColor} />
        <Controls showInteractive={false} />

        {/* グラフ内に凡例を配置 */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: legendBg,
            color: legendTextColor,
            padding: '12px',
            borderRadius: '8px',
            boxShadow: legendShadow,
            fontSize: '12px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#3b82f6',
                marginRight: '8px',
              }}
            />
            Root
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#f59e0b',
                marginRight: '8px',
              }}
            />
            Branch
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#10b981',
                marginRight: '8px',
              }}
            />
            Leaf
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}
