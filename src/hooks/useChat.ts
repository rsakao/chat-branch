import { useState, useCallback, useEffect } from 'react'
import { Message } from '@/types'
import { generateId, buildPathToMessage } from '@/utils/helpers'

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Record<string, Message>>({})
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadMessages = useCallback(async () => {
    if (!conversationId) return
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || {})
        setCurrentPath(data.currentPath || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      // サンプルデータで初期化
      const sampleMessages: Record<string, Message> = {
        'msg_1': {
          id: 'msg_1',
          role: 'user',
          content: '人工知能について教えてください',
          conversationId: conversationId,
          parentId: undefined,
          children: ['msg_2'],
          branchIndex: 0,
          timestamp: new Date().toISOString()
        },
        'msg_2': {
          id: 'msg_2',
          role: 'assistant',
          content: '人工知能（AI）は、人間の知能をコンピュータで模倣する技術です。機械学習、深層学習、自然言語処理などの分野があります。',
          conversationId: conversationId,
          parentId: 'msg_1',
          children: [],
          branchIndex: 0,
          timestamp: new Date().toISOString()
        }
      }
      setMessages(sampleMessages)
      setCurrentPath(['msg_1', 'msg_2'])
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || isLoading) return

    setIsLoading(true)
    
    try {
      // ユーザーメッセージを作成
      const userMessage: Message = {
        id: generateId('msg'),
        role: 'user',
        content,
        conversationId,
        parentId: currentPath[currentPath.length - 1] || undefined,
        children: [],
        branchIndex: 0,
        timestamp: new Date().toISOString()
      }

      // 親メッセージを更新（子を追加）
      const parentId = userMessage.parentId
      if (parentId) {
        setMessages(prev => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            children: [...prev[parentId].children, userMessage.id]
          }
        }))
      }

      // ユーザーメッセージを追加
      setMessages(prev => ({
        ...prev,
        [userMessage.id]: userMessage
      }))

      // パスを更新
      const newPath = [...currentPath, userMessage.id]
      setCurrentPath(newPath)

      // AI応答を生成
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content,
          parentMessageId: userMessage.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: Message = {
          id: generateId('msg'),
          role: 'assistant',
          content: data.content,
          conversationId,
          parentId: userMessage.id,
          children: [],
          branchIndex: 0,
          timestamp: new Date().toISOString()
        }

        // ユーザーメッセージに子を追加
        setMessages(prev => ({
          ...prev,
          [userMessage.id]: {
            ...prev[userMessage.id],
            children: [aiMessage.id]
          },
          [aiMessage.id]: aiMessage
        }))

        // パスを更新
        setCurrentPath([...newPath, aiMessage.id])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // フォールバック応答
      const aiMessage: Message = {
        id: generateId('msg'),
        role: 'assistant',
        content: '申し訳ございませんが、現在応答を生成できません。後でもう一度お試しください。',
        conversationId,
        parentId: currentPath[currentPath.length - 1],
        children: [],
        branchIndex: 0,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => ({
        ...prev,
        [aiMessage.id]: aiMessage
      }))
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, currentPath, isLoading])

  const createBranch = useCallback(async (fromMessageId: string) => {
    if (!conversationId) return

    // 新しいパスを構築
    const newPath = buildPathToMessage(fromMessageId, messages)
    setCurrentPath(newPath)

    try {
      await fetch(`/api/conversations/${conversationId}/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: fromMessageId })
      })
    } catch (error) {
      console.error('Failed to create branch:', error)
    }
  }, [conversationId, messages])

  const selectMessage = useCallback((messageId: string) => {
    const newPath = buildPathToMessage(messageId, messages)
    setCurrentPath(newPath)
  }, [messages])

  // 現在のパスに沿ったメッセージを取得
  const currentMessages = currentPath
    .map(id => messages[id])
    .filter(Boolean)

  return {
    messages: currentMessages,
    allMessages: messages,
    currentPath,
    isLoading,
    sendMessage,
    createBranch,
    selectMessage,
    loadMessages
  }
} 