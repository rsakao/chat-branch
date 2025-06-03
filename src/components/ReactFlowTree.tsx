import React, { useCallback, useMemo } from 'react'
import { 
  ReactFlow, 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  ConnectionMode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Message } from '@/types'
import { truncateText } from '@/utils/helpers'

interface ReactFlowTreeProps {
  messages: Record<string, Message>
  currentMessages: Message[]
  onSelectMessage: (messageId: string) => void
}

// ノードタイプを判定する関数
const getNodeType = (messageId: string, messages: Record<string, Message>): 'root' | 'branch' | 'leaf' => {
  const message = messages[messageId]
  if (!message) return 'leaf'
  
  // 親がない場合はルート
  if (!message.parentId) return 'root'
  
  // 子がない場合はリーフ
  if (!message.children || message.children.length === 0) return 'leaf'
  
  // それ以外はブランチ
  return 'branch'
}

// ノードタイプ別のスタイル
const getNodeStyle = (nodeType: 'root' | 'branch' | 'leaf', isActive: boolean) => {
  const baseStyle = {
    width: 120,
    height: 80,
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }

  const styles = {
    root: {
      ...baseStyle,
      background: isActive ? '#2563eb' : '#3b82f6',
      color: 'white'
    },
    branch: {
      ...baseStyle,
      background: isActive ? '#d97706' : '#f59e0b',
      color: 'white'
    },
    leaf: {
      ...baseStyle,
      background: isActive ? '#059669' : '#10b981',
      color: 'white'
    }
  }

  return styles[nodeType]
}

export default function ReactFlowTree({ 
  messages, 
  currentMessages, 
  onSelectMessage 
}: ReactFlowTreeProps) {
  const currentMessageIds = new Set(currentMessages.map(m => m.id))

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // 改良されたレイアウトアルゴリズム
    const calculatePositions = () => {
      const levels = new Map<string, number>()
      const levelNodes = new Map<number, string[]>()
      
      // レベル計算
      const calculateLevel = (messageId: string, level = 0) => {
        if (levels.has(messageId)) return
        
        levels.set(messageId, level)
        
        if (!levelNodes.has(level)) {
          levelNodes.set(level, [])
        }
        levelNodes.get(level)!.push(messageId)
        
        const message = messages[messageId]
        if (message?.children) {
          message.children.forEach(childId => {
            calculateLevel(childId, level + 1)
          })
        }
      }

      // ルートメッセージを見つけてレベル計算開始
      Object.values(messages).forEach(message => {
        if (!message.parentId) {
          calculateLevel(message.id)
        }
      })

      return { levels, levelNodes }
    }

    const { levels, levelNodes } = calculatePositions()

    // ノード作成
    Object.entries(messages).forEach(([messageId, message]) => {
      const level = levels.get(messageId) || 0
      const nodesAtLevel = levelNodes.get(level) || []
      const indexAtLevel = nodesAtLevel.indexOf(messageId)
      
      // 水平間隔を調整
      const horizontalSpacing = 250
      const verticalSpacing = 150
      const centerOffset = (nodesAtLevel.length - 1) * horizontalSpacing / 2
      
      const x = indexAtLevel * horizontalSpacing - centerOffset
      const y = level * verticalSpacing
      
      const nodeType = getNodeType(messageId, messages)
      const isActive = currentMessageIds.has(messageId)
      
      nodes.push({
        id: messageId,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div style={{
              textAlign: 'center',
              padding: '8px',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ 
                fontSize: '16px', 
                marginBottom: '4px',
                fontWeight: 'bold'
              }}>
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div style={{ 
                fontSize: '11px', 
                lineHeight: '1.2',
                textAlign: 'center',
                wordBreak: 'break-word',
                overflow: 'hidden'
              }}>
                {truncateText(message.content, 20)}
              </div>
            </div>
          )
        },
        style: getNodeStyle(nodeType, isActive)
      })
    })

    // エッジ作成（より美しいスタイル）
    Object.entries(messages).forEach(([messageId, message]) => {
      if (message.children) {
        message.children.forEach((childId, index) => {
          edges.push({
            id: `${messageId}-${childId}`,
            source: messageId,
            target: childId,
            type: 'smoothstep',
            style: {
              stroke: '#64748b',
              strokeWidth: 2,
              strokeDasharray: '0'
            },
            labelStyle: {
              fontSize: '10px',
              fontWeight: 'bold',
              fill: '#64748b'
            },
            label: `分岐${index + 1}`
          })
        })
      }
    })

    return { nodes, edges }
  }, [messages, currentMessageIds])

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  const onNodeClick = useCallback((_: any, node: Node) => {
    onSelectMessage(node.id)
  }, [onSelectMessage])

  return (
    <div style={{ height: '100%', width: '100%', background: '#f8fafc' }}>
      {/* ヘッダー */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1e293b'
      }}>
        Conversation Tree
      </div>

      {/* 凡例 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#3b82f6',
            marginRight: '8px'
          }} />
          Root
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#f59e0b',
            marginRight: '8px'
          }} />
          Branch
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#10b981',
            marginRight: '8px'
          }} />
          Leaf
        </div>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ background: '#f8fafc' }}
      >
        <Background color="#e2e8f0" />
        <Controls />
      </ReactFlow>
    </div>
  )
} 