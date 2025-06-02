import { NextRequest, NextResponse } from 'next/server'

// 仮のインメモリストレージ（本来はデータベースを使用）
let conversations: any[] = []

export async function GET() {
  try {
    return NextResponse.json({
      conversations: conversations
    })
  } catch (error) {
    console.error('Conversations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const conversation = await request.json()
    
    if (!conversation.id || !conversation.title) {
      return NextResponse.json(
        { error: 'Conversation ID and title are required' },
        { status: 400 }
      )
    }

    // 新しい会話を追加
    conversations.unshift(conversation)
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Conversations POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 