import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは親切で知識豊富なAIアシスタントです。日本語で分かりやすく回答してください。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content || '申し訳ございませんが、応答を生成できませんでした。'

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