import { useState, useCallback, useEffect } from 'react';
import { Message } from '@/types';
import { generateId, buildPathToMessage } from '@/utils/helpers';
import { useLocale } from './useLocale';

// Helper function to handle error fallback for AI messages
const handleErrorFallback = async (
  userMessage: Message,
  updatedMessages: Record<string, Message>,
  updatedPath: string[],
  locale: string,
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message>>>,
  setCurrentPath: React.Dispatch<React.SetStateAction<string[]>>,
  saveMessages: (messages: Message[], path: string[]) => Promise<void>
) => {
  // フォールバック応答（言語に応じてメッセージを変更）
  const errorMessage =
    locale === 'ja'
      ? '申し訳ございませんが、現在応答を生成できません。後でもう一度お試しください。'
      : 'Sorry, I cannot generate a response at the moment. Please try again later.';

  // 既に作成されたAIメッセージがある場合は更新、なければ新規作成
  const existingAiMessage = Object.values(updatedMessages).find(
    (msg) => msg.parentId === userMessage.id && msg.role === 'assistant'
  );

  if (existingAiMessage) {
    // 既存のAIメッセージを更新
    setMessages((prev) => ({
      ...prev,
      [existingAiMessage.id]: {
        ...existingAiMessage,
        content: errorMessage,
      },
    }));

    await saveMessages(
      [userMessage, { ...existingAiMessage, content: errorMessage }],
      [...updatedPath, existingAiMessage.id]
    );
  } else {
    // 新しいエラーメッセージを作成
    const aiMessage: Message = {
      id: generateId('msg'),
      role: 'assistant',
      content: errorMessage,
      conversationId: userMessage.conversationId,
      parentId: userMessage.id,
      children: [],
      branchIndex: 0,
      timestamp: new Date().toISOString(),
    };

    const finalUpdatedMessages = {
      ...updatedMessages,
      [userMessage.id]: {
        ...updatedMessages[userMessage.id],
        children: [aiMessage.id],
      },
      [aiMessage.id]: aiMessage,
    };
    setMessages(finalUpdatedMessages);

    const finalPath = [...updatedPath, aiMessage.id];
    setCurrentPath(finalPath);

    // フォールバック応答もデータベースに保存
    await saveMessages([userMessage, aiMessage], finalPath);
  }
};

export function useChat(conversationId: string | null) {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<Record<string, Message>>({});
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || {});
        setCurrentPath(data.currentPath || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      // サンプルデータで初期化
      const sampleMessages: Record<string, Message> = {
        msg_1: {
          id: 'msg_1',
          role: 'user',
          content: '人工知能について教えてください',
          conversationId: conversationId,
          parentId: undefined,
          children: ['msg_2'],
          branchIndex: 0,
          timestamp: new Date().toISOString(),
        },
        msg_2: {
          id: 'msg_2',
          role: 'assistant',
          content:
            '人工知能（AI）は、人間の知能をコンピュータで模倣する技術です。機械学習、深層学習、自然言語処理などの分野があります。',
          conversationId: conversationId,
          parentId: 'msg_1',
          children: [],
          branchIndex: 0,
          timestamp: new Date().toISOString(),
        },
      };
      setMessages(sampleMessages);
      setCurrentPath(['msg_1', 'msg_2']);
    }
  }, [conversationId]);

  const saveMessages = useCallback(
    async (messagesToSave: Message[], newPath: string[]) => {
      if (!conversationId) return;

      try {
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesToSave,
            currentPath: newPath,
          }),
        });
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      branchFromMessageId?: string,
      quotedMessage?: Message,
      quotedText?: string
    ) => {
      if (!conversationId || isLoading) return;

      setIsLoading(true);

      // 分岐元が指定されている場合は、そのメッセージを親にする
      let parentId: string | undefined;
      let newPath: string[];

      if (branchFromMessageId) {
        parentId = branchFromMessageId;
        newPath = buildPathToMessage(branchFromMessageId, messages);
        setCurrentPath(newPath);
      } else {
        parentId = currentPath[currentPath.length - 1] || undefined;
        newPath = currentPath;
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
        timestamp: new Date().toISOString(),
      };

      // 親メッセージを更新（子を追加）
      const updatedMessages = { ...messages };

      if (parentId && updatedMessages[parentId]) {
        updatedMessages[parentId] = {
          ...updatedMessages[parentId],
          children: [...updatedMessages[parentId].children, userMessage.id],
        };
      }

      // ユーザーメッセージを追加
      updatedMessages[userMessage.id] = userMessage;
      setMessages(updatedMessages);

      // パスを更新
      const updatedPath = [...newPath, userMessage.id];
      setCurrentPath(updatedPath);

      // フォールバック時に使用するメッセージのスナップショット
      let messagesForFallback = updatedMessages;

      try {
        // 保存された設定からモデルを取得
        let selectedModel = 'o4-mini';
        try {
          const savedSettings = localStorage.getItem('chatAppSettings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            selectedModel = settings.aiModel || 'o4-mini';
          }
        } catch (error) {
          console.error('Failed to load model setting:', error);
        }

        // AI応答を生成（ストリーミング対応）
        const aiMessageId = generateId('msg');
        const aiMessage: Message = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          conversationId,
          parentId: userMessage.id,
          children: [],
          branchIndex: 0,
          timestamp: new Date().toISOString(),
        };

        // 空のAIメッセージを先に追加してストリーミング開始
        const messagesWithAi = {
          ...updatedMessages,
          [userMessage.id]: {
            ...updatedMessages[userMessage.id],
            children: [aiMessage.id],
          },
          [aiMessage.id]: aiMessage,
        };
        setMessages(messagesWithAi);
        setStreamingMessageId(aiMessageId);
        // スナップショットを更新
        messagesForFallback = messagesWithAi;

        // パスを更新
        const finalPath = [...updatedPath, aiMessage.id];
        setCurrentPath(finalPath);

        // ストリーミングAPIを呼び出し
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            message: content,
            parentMessageId: userMessage.id,
            quotedMessage,
            quotedText,
            model: selectedModel,
            locale,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let usage = null;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));

                    if (data.type === 'content') {
                      fullContent = data.fullContent;
                      // メッセージ内容を更新
                      setMessages((prev) => ({
                        ...prev,
                        [aiMessageId]: {
                          ...prev[aiMessageId],
                          content: fullContent,
                        },
                      }));
                    } else if (data.type === 'complete') {
                      fullContent = data.fullContent;
                      usage = data.usage;
                      // 最終的なメッセージ内容を設定
                      setMessages((prev) => ({
                        ...prev,
                        [aiMessageId]: {
                          ...prev[aiMessageId],
                          content: fullContent,
                          usage: usage,
                        },
                      }));
                      break;
                    } else if (data.type === 'error') {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    console.error(
                      'Failed to parse streaming data:',
                      parseError
                    );
                  }
                }
              }
            }

            // ストリーミング完了
            setStreamingMessageId(null);

            // データベースに保存
            const finalAiMessage = {
              ...aiMessage,
              content: fullContent,
              usage: usage || undefined,
            };
            await saveMessages([userMessage, finalAiMessage], finalPath);
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            throw streamError;
          }
        } else {
          throw new Error('Failed to get streaming response');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // ストリーミングエラーの場合のクリーンアップ
        setStreamingMessageId(null);

        await handleErrorFallback(
          userMessage,
          messagesForFallback,
          updatedPath,
          locale,
          setMessages,
          setCurrentPath,
          saveMessages
        );
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, currentPath, isLoading, messages, saveMessages, locale]
  );

  const createBranch = useCallback(
    async (fromMessageId: string) => {
      if (!conversationId) return;

      // 新しいパスを構築
      const newPath = buildPathToMessage(fromMessageId, messages);
      setCurrentPath(newPath);

      try {
        // パスの更新をデータベースに保存
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPath: newPath,
          }),
        });
      } catch (error) {
        console.error('Failed to create branch:', error);
      }
    },
    [conversationId, messages]
  );

  const selectMessage = useCallback(
    async (messageId: string) => {
      const newPath = buildPathToMessage(messageId, messages);
      setCurrentPath(newPath);

      try {
        // パスの更新をデータベースに保存
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPath: newPath,
          }),
        });
      } catch (error) {
        console.error('Failed to select message:', error);
      }
    },
    [messages, conversationId]
  );

  // 現在のパスに沿ったメッセージを取得
  const currentMessages = currentPath.map((id) => messages[id]).filter(Boolean);

  return {
    messages: currentMessages,
    allMessages: messages,
    currentPath,
    isLoading,
    streamingMessageId,
    sendMessage,
    createBranch,
    selectMessage,
    loadMessages,
  };
}
