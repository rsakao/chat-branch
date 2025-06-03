import { useState, useCallback } from 'react'
import { Conversation } from '@/types'
import { generateId } from '@/utils/helpers'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        
        // 最後に使用した会話IDをlocalStorageから取得
        const lastConversationId = localStorage.getItem('lastConversationId')
        if (lastConversationId && data.conversations?.some((c: Conversation) => c.id === lastConversationId)) {
          setCurrentConversationId(lastConversationId)
        } else if (data.conversations && data.conversations.length > 0) {
          setCurrentConversationId(data.conversations[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [])

  const createConversation = useCallback(async () => {
    const newConversation: Conversation = {
      id: generateId('conv'),
      title: '新しい会話',
      messages: {},
      rootMessageId: undefined,
      currentPath: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConversation)
      })

      if (response.ok) {
        const savedConversation = await response.json()
        setConversations(prev => [savedConversation, ...prev])
        setCurrentConversationId(savedConversation.id)
        
        // localStorageに保存
        localStorage.setItem('lastConversationId', savedConversation.id)
        
        return savedConversation
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }

    // フォールバック：ローカルに追加
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
    localStorage.setItem('lastConversationId', newConversation.id)
    return newConversation
  }, [])

  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId)
    // 最後に使用した会話IDを保存
    localStorage.setItem('lastConversationId', conversationId)
  }, [])

  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
          : conv
      )
    )
  }, [])

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // ローカル状態から削除
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        
        // 削除された会話が現在選択されている場合
        if (currentConversationId === conversationId) {
          const remainingConversations = conversations.filter(conv => conv.id !== conversationId)
          if (remainingConversations.length > 0) {
            // 最初の会話を選択
            setCurrentConversationId(remainingConversations[0].id)
            localStorage.setItem('lastConversationId', remainingConversations[0].id)
          } else {
            // 会話がなくなった場合
            setCurrentConversationId(null)
            localStorage.removeItem('lastConversationId')
          }
        }
        
        return true
      } else {
        throw new Error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      return false
    }
  }, [currentConversationId, conversations])

  return {
    conversations,
    currentConversationId,
    loadConversations,
    createConversation,
    switchConversation,
    updateConversation,
    deleteConversation
  }
} 