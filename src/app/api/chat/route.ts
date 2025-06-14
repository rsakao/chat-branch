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
    const completion = await openai.chat.completions.create({
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
      ...(useMaxCompletionTokens
        ? { max_completion_tokens: 4000 }
        : { max_tokens: 1000, temperature: 0.7 }),
    });

    console.log('OpenAI Response:', JSON.stringify(completion, null, 2));
    console.log('Response choices:', completion.choices);
    console.log(
      'First choice content:',
      completion.choices[0]?.message?.content
    );

    const content =
      completion.choices[0]?.message?.content ||
      (locale === 'ja'
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

    return NextResponse.json({
      content,
      usage: completion.usage,
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
