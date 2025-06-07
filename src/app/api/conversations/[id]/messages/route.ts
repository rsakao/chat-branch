import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaMessage } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Convert messages to frontend format
    const messages = conversation.messages.reduce(
      (acc: Record<string, object>, msg: PrismaMessage) => {
        acc[msg.id] = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          conversationId: msg.conversationId,
          parentId: msg.parentId,
          children: conversation.messages
            .filter((m: PrismaMessage) => m.parentId === msg.id)
            .map((m: PrismaMessage) => m.id),
          branchIndex: msg.branchIndex,
          timestamp: msg.timestamp.toISOString(),
        };
        return acc;
      },
      {}
    );

    return NextResponse.json({
      messages,
      currentPath: conversation.currentPath
        ? JSON.parse(conversation.currentPath)
        : [],
    });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = id;
    const { messages: newMessages, currentPath } = await request.json();

    // Update conversation's current path
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        currentPath: JSON.stringify(currentPath || []),
        updatedAt: new Date(),
      },
    });

    // Add new messages
    if (newMessages && Array.isArray(newMessages)) {
      for (const message of newMessages) {
        // parentIdが指定されている場合は、そのメッセージが存在するかチェック
        if (message.parentId) {
          const parentExists = await prisma.message.findUnique({
            where: { id: message.parentId },
          });
          if (!parentExists) {
            return NextResponse.json(
              { error: `Parent message (${message.parentId}) not found` },
              { status: 400 }
            );
          }
        }
        await prisma.message.upsert({
          where: { id: message.id },
          update: {
            content: message.content,
            role: message.role,
            parentId: message.parentId,
            branchIndex: message.branchIndex || 0,
          },
          create: {
            id: message.id,
            role: message.role,
            content: message.content,
            conversationId: conversationId,
            parentId: message.parentId,
            branchIndex: message.branchIndex || 0,
            timestamp: new Date(message.timestamp || new Date()),
          },
        });
      }
    }

    // Get updated messages
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = conversation.messages.reduce(
      (acc: Record<string, object>, msg: PrismaMessage) => {
        acc[msg.id] = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          conversationId: msg.conversationId,
          parentId: msg.parentId,
          children: conversation.messages
            .filter((m: PrismaMessage) => m.parentId === msg.id)
            .map((m: PrismaMessage) => m.id),
          branchIndex: msg.branchIndex,
          timestamp: msg.timestamp.toISOString(),
        };
        return acc;
      },
      {}
    );

    return NextResponse.json({
      messages,
      currentPath: conversation.currentPath
        ? JSON.parse(conversation.currentPath)
        : [],
    });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
