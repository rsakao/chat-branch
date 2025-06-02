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
        if (data.conversations && data.conversations.length > 0) {
          setCurrentConversationId(data.conversations[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
      // サンプルデータで初期化
      const sampleConversation: Conversation = {
        id: 'conv_1',
        title: '人工知能の基礎',
        messages: {},
        rootMessageId: undefined,
        currentPath: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setConversations([sampleConversation])
      setCurrentConversationId(sampleConversation.id)
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
        return savedConversation
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }

    // フォールバック：ローカルに追加
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
    return newConversation
  }, [])

  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId)
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

  return {
    conversations,
    currentConversationId,
    loadConversations,
    createConversation,
    switchConversation,
    updateConversation
  }
} 