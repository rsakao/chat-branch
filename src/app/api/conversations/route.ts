import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Convert to frontend format
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      userId: conv.userId,
      messages: conv.messages.reduce(
        (acc, msg) => {
          acc[msg.id] = {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            conversationId: msg.conversationId,
            parentId: msg.parentId,
            children: conv.messages
              .filter((m) => m.parentId === msg.id)
              .map((m) => m.id),
            branchIndex: msg.branchIndex,
            timestamp: msg.timestamp.toISOString(),
          };
          return acc;
        },
        {} as Record<string, object>
      ),
      rootMessageId: conv.rootMessageId,
      currentPath: conv.currentPath ? JSON.parse(conv.currentPath) : [],
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id || !data.title) {
      return NextResponse.json(
        { error: 'Conversation ID and title are required' },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        id: data.id,
        title: data.title,
        userId: data.userId,
        rootMessageId: data.rootMessageId,
        currentPath: JSON.stringify(data.currentPath || []),
      },
      include: {
        messages: true,
      },
    });

    // Convert to frontend format
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      messages: {},
      rootMessageId: conversation.rootMessageId,
      currentPath: conversation.currentPath
        ? JSON.parse(conversation.currentPath)
        : [],
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedConversation);
  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
