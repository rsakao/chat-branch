import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { buildEnhancedQuotedPrompt, SYSTEM_PROMPT_WITH_QUOTE } from '@/utils/prompts'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, quotedMessage, quotedText } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // 引用メッセージがある場合の高度なプロンプト構築
    let userPrompt = message
    if (quotedMessage && quotedText) {
      userPrompt = buildEnhancedQuotedPrompt(message, quotedText, quotedMessage)
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT_WITH_QUOTE
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || '申し訳ございませんが、応答を生成できませんでした。'

    // 会話のタイトルを自動更新（最初のメッセージの場合）
    if (conversationId) {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: true }
        })

        // メッセージが1つもない、または「新しい会話」のままの場合はタイトルを更新
        if (conversation && (conversation.messages.length === 0 || conversation.title === '新しい会話')) {
          const title = message.length > 30 ? message.substring(0, 30) + '...' : message
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { title }
          })
        }
      } catch (error) {
        console.error('Failed to update conversation title:', error)
      }
    }

    return NextResponse.json({
      content,
      usage: completion.usage
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 