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

  const saveMessages = useCallback(async (messagesToSave: Message[], newPath: string[]) => {
    if (!conversationId) return

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSave,
          currentPath: newPath
        })
      })
    } catch (error) {
      console.error('Failed to save messages:', error)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const sendMessage = useCallback(async (
    content: string, 
    branchFromMessageId?: string,
    quotedMessage?: any,
    quotedText?: string
  ) => {
    if (!conversationId || isLoading) return

    setIsLoading(true)
    
    // 分岐元が指定されている場合は、そのメッセージを親にする
    let parentId: string | undefined
    let newPath: string[]
    
    if (branchFromMessageId) {
      parentId = branchFromMessageId
      newPath = buildPathToMessage(branchFromMessageId, messages)
      setCurrentPath(newPath)
    } else {
      parentId = currentPath[currentPath.length - 1] || undefined
      newPath = currentPath
    }

    // ユーザーメッセージを作成
    const userMessage: Message = {
      id: generateId('msg'),
      role: 'user',
      content,
      conversationId,
      parentId,
      children: [],
      branchIndex: 0,
      timestamp: new Date().toISOString()
    }

    // 親メッセージを更新（子を追加）
    const updatedMessages = { ...messages }
    
    if (parentId && updatedMessages[parentId]) {
      updatedMessages[parentId] = {
        ...updatedMessages[parentId],
        children: [...updatedMessages[parentId].children, userMessage.id]
      }
    }

    // ユーザーメッセージを追加
    updatedMessages[userMessage.id] = userMessage
    setMessages(updatedMessages)

    // パスを更新
    const updatedPath = [...newPath, userMessage.id]
    setCurrentPath(updatedPath)

    try {
      // AI応答を生成（引用メッセージの情報を含める）
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content,
          parentMessageId: userMessage.id,
          quotedMessage,
          quotedText
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
        const finalMessages = {
          ...updatedMessages,
          [userMessage.id]: {
            ...updatedMessages[userMessage.id],
            children: [aiMessage.id]
          },
          [aiMessage.id]: aiMessage
        }

        setMessages(finalMessages)

        // パスを更新
        const finalPath = [...updatedPath, aiMessage.id]
        setCurrentPath(finalPath)

        // データベースに保存
        await saveMessages([userMessage, aiMessage], finalPath)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // フォールバック応答
      const aiMessage: Message = {
        id: generateId('msg'),
        role: 'assistant',
        content: '申し訳ございませんが、現在応答を生成できません。後でもう一度お試しください。',
        conversationId,
        parentId: updatedPath[updatedPath.length - 1],
        children: [],
        branchIndex: 0,
        timestamp: new Date().toISOString()
      }

      const finalUpdatedMessages = { ...updatedMessages, [aiMessage.id]: aiMessage }
      setMessages(finalUpdatedMessages)
      
      const finalPath = [...updatedPath, aiMessage.id]
      setCurrentPath(finalPath)
      
      // フォールバック応答もデータベースに保存
      await saveMessages([aiMessage], finalPath)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, currentPath, isLoading, messages, saveMessages])

  const createBranch = useCallback(async (fromMessageId: string) => {
    if (!conversationId) return

    // 新しいパスを構築
    const newPath = buildPathToMessage(fromMessageId, messages)
    setCurrentPath(newPath)

    try {
      // パスの更新をデータベースに保存
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPath: newPath
        })
      })
    } catch (error) {
      console.error('Failed to create branch:', error)
    }
  }, [conversationId, messages])

  const selectMessage = useCallback(async (messageId: string) => {
    const newPath = buildPathToMessage(messageId, messages)
    setCurrentPath(newPath)

    try {
      // パスの更新をデータベースに保存
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPath: newPath
        })
      })
    } catch (error) {
      console.error('Failed to select message:', error)
    }
  }, [messages, conversationId])

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