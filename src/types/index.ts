export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  conversationId: string
  parentId?: string
  children: string[]
  branchIndex: number
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  userId?: string
  messages: Record<string, Message>
  rootMessageId?: string
  currentPath: string[]
  createdAt: string
  updatedAt: string
}

export interface TreeNode {
  id: string
  type: 'default'
  position: { x: number; y: number }
  data: {
    label: string
    role: 'user' | 'assistant'
    content: string
    isActive: boolean
  }
}

export interface TreeEdge {
  id: string
  source: string
  target: string
  type: 'default'
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  treeViewMode: 'auto' | 'simple' | 'advanced'
  debugMode: boolean
  aiModel: string
} 