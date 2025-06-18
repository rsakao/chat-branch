import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { buildEnhancedQuotedPrompt, getSystemPrompt } from '@/utils/prompts';

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationId,
      quotedMessage,
      quotedText,
      model = 'gpt-4o-mini',
      locale = 'en', // デフォルトは英語
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 言語に応じたシステムプロンプトを取得
    const systemPrompt = getSystemPrompt(locale);

    // 引用メッセージがある場合の高度なプロンプト構築
    let userPrompt = message;
    if (quotedMessage && quotedText) {
      userPrompt = buildEnhancedQuotedPrompt(
        message,
        quotedText,
        quotedMessage,
        locale
      );
    }

    // o系モデルはmax_completion_tokensを使う
    const useMaxCompletionTokens = /^(gpt-4o|gpt-4o-mini|o4-mini|o3-mini)/.test(
      model
    );
    // Enable streaming
    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      stream: true,
      ...(useMaxCompletionTokens
        ? { max_completion_tokens: 4000 }
        : { max_tokens: 1000, temperature: 0.7 }),
    });

    let fullContent = '';
    let usage = null;

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              // Send streaming data as Server-Sent Events
              const data = JSON.stringify({ 
                type: 'content', 
                content: delta,
                fullContent: fullContent 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            
            // Capture usage information if available
            if (chunk.usage) {
              usage = chunk.usage;
            }
          }
          
          // Send completion event
          const completionData = JSON.stringify({ 
            type: 'complete', 
            fullContent: fullContent,
            usage: usage
          });
          controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
          
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: 'Failed to stream response' 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    const content = fullContent || (locale === 'ja'
      ? '申し訳ございませんが、応答を生成できませんでした。'
      : 'Sorry, I could not generate a response.');

    // 会話のタイトルを自動更新（最初のメッセージの場合）
    if (conversationId) {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: true },
        });

        // メッセージが1つもない、またはデフォルトタイトルのままの場合はタイトルを更新
        if (
          conversation &&
          (conversation.messages.length === 0 ||
            conversation.title === 'New Conversation' ||
            conversation.title === '新しい会話')
        ) {
          const title =
            message.length > 30 ? message.substring(0, 30) + '...' : message;
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { title },
          });
        }
      } catch (error) {
        console.error('Failed to update conversation title:', error);
      }
    }

    // Return streaming response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
