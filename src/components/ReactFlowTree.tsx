import { useCallback, useMemo } from 'react'
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

export default function ReactFlowTree({ 
  messages, 
  currentMessages, 
  onSelectMessage 
}: ReactFlowTreeProps) {
  const currentMessageIds = new Set(currentMessages.map(m => m.id))

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, { x: number; y: number; level: number }>()
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Calculate positions using tree layout algorithm
    const calculatePositions = () => {
      const levelCounts = new Map<number, number>()
      const levels = new Map<string, number>()
      
      // First pass: calculate levels
      const calculateLevel = (messageId: string, level = 0) => {
        if (levels.has(messageId)) return
        
        levels.set(messageId, level)
        const count = levelCounts.get(level) || 0
        levelCounts.set(level, count + 1)
        
        const message = messages[messageId]
        if (message?.children) {
          message.children.forEach(childId => {
            calculateLevel(childId, level + 1)
          })
        }
      }

      // Find root messages and calculate levels
      Object.values(messages).forEach(message => {
        if (!message.parentId) {
          calculateLevel(message.id)
        }
      })

      // Second pass: assign positions
      const levelPositions = new Map<number, number>()
      
      Object.entries(messages).forEach(([messageId, message]) => {
        const level = levels.get(messageId) || 0
        const currentPos = levelPositions.get(level) || 0
        
        nodeMap.set(messageId, {
          x: currentPos * 250,
          y: level * 100,
          level
        })
        
        levelPositions.set(level, currentPos + 1)
      })
    }

    calculatePositions()

    // Create nodes
    Object.entries(messages).forEach(([messageId, message]) => {
      const position = nodeMap.get(messageId) || { x: 0, y: 0, level: 0 }
      const isActive = currentMessageIds.has(messageId)
      
      nodes.push({
        id: messageId,
        type: 'default',
        position: { x: position.x, y: position.y },
        data: {
          label: (
            <div className={`tree-flow-node ${message.role} ${isActive ? 'active' : ''}`}>
              <div className="node-header">
                <span className="node-role">
                  {message.role === 'user' ? '👤' : '🤖'}
                </span>
              </div>
              <div className="node-content">
                {truncateText(message.content, 50)}
              </div>
            </div>
          )
        },
        style: {
          background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
          color: isActive ? 'var(--color-btn-primary-text)' : 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          width: 200,
          fontSize: '12px'
        }
      })
    })

    // Create edges
    Object.entries(messages).forEach(([messageId, message]) => {
      if (message.children) {
        message.children.forEach(childId => {
          edges.push({
            id: `${messageId}-${childId}`,
            source: messageId,
            target: childId,
            type: 'default',
            style: {
              stroke: 'var(--color-border)',
              strokeWidth: 2
            }
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
    <div className="react-flow-tree" style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      <style jsx>{`
        .tree-flow-node {
          padding: 8px;
          border-radius: 6px;
          width: 100%;
          height: 100%;
        }
        
        .tree-flow-node.user {
          border-left: 3px solid var(--color-primary);
        }
        
        .tree-flow-node.assistant {
          border-left: 3px solid var(--color-success);
        }
        
        .tree-flow-node.active {
          background: var(--color-primary) !important;
          color: var(--color-btn-primary-text) !important;
        }
        
        .node-header {
          margin-bottom: 4px;
        }
        
        .node-role {
          font-size: 14px;
        }
        
        .node-content {
          font-size: 11px;
          line-height: 1.3;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  )
} 