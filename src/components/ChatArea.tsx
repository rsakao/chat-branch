import { useState, useRef, useEffect, memo } from 'react';
import {
  Send,
  GitBranch,
  Eye,
  Quote,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useTranslations } from 'next-intl';
import { Conversation, Message } from '@/types';

interface ChatAreaProps {
  conversation?: Conversation;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (
    content: string,
    branchFromMessageId?: string,
    quotedMessage?: Message,
    quotedText?: string
  ) => void;
  onCreateBranch: (messageId: string) => void;
  onToggleTree: () => void;
}

// ReactMarkdownのcomponents定義を外部化（再生成を防ぐ）
const markdownComponents = {
  p: ({ children }: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="markdown-paragraph">{children}</p>
  ),
  h1: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h1 className="markdown-h1">{children}</h1>
  ),
  h2: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h2 className="markdown-h2">{children}</h2>
  ),
  h3: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h3 className="markdown-h3">{children}</h3>
  ),
  h4: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h4 className="markdown-h4">{children}</h4>
  ),
  h5: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h5 className="markdown-h5">{children}</h5>
  ),
  h6: ({ children }: React.HTMLProps<HTMLHeadingElement>) => (
    <h6 className="markdown-h6">{children}</h6>
  ),
  ul: ({ children }: React.HTMLProps<HTMLUListElement>) => (
    <ul className="markdown-ul">{children}</ul>
  ),
  ol: ({ children }: React.HTMLProps<HTMLOListElement>) => (
    <ol className="markdown-ol">{children}</ol>
  ),
  li: ({ children }: React.HTMLProps<HTMLLIElement>) => (
    <li className="markdown-li">{children}</li>
  ),
  blockquote: ({ children }: React.HTMLProps<HTMLQuoteElement>) => (
    <blockquote className="markdown-blockquote">{children}</blockquote>
  ),
  hr: () => <hr className="markdown-hr" />,
  code: ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
    if (className?.startsWith('language-')) {
      return (
        <code className={`markdown-code-block ${className}`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="markdown-code-inline" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => (
    <pre className="markdown-pre" {...props}>
      {children}
    </pre>
  ),
  table: ({ children }: React.HTMLProps<HTMLTableElement>) => (
    <table className="markdown-table">{children}</table>
  ),
  thead: ({ children }: React.HTMLProps<HTMLTableSectionElement>) => (
    <thead className="markdown-thead">{children}</thead>
  ),
  tbody: ({ children }: React.HTMLProps<HTMLTableSectionElement>) => (
    <tbody className="markdown-tbody">{children}</tbody>
  ),
  tr: ({ children }: React.HTMLProps<HTMLTableRowElement>) => (
    <tr className="markdown-tr">{children}</tr>
  ),
  th: ({ children }: React.HTMLProps<HTMLTableHeaderCellElement>) => (
    <th className="markdown-th">{children}</th>
  ),
  td: ({ children }: React.HTMLProps<HTMLTableDataCellElement>) => (
    <td className="markdown-td">{children}</td>
  ),
  a: ({ children, href, ...props }: React.HTMLProps<HTMLAnchorElement>) => (
    <a
      href={href}
      className="markdown-link"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children }: React.HTMLProps<HTMLElement>) => (
    <strong className="markdown-strong">{children}</strong>
  ),
  em: ({ children }: React.HTMLProps<HTMLElement>) => (
    <em className="markdown-em">{children}</em>
  ),
  input: ({ type, checked, ...props }: React.HTMLProps<HTMLInputElement>) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="markdown-checkbox"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
};

// メッセージ内容コンポーネント（React.memoで最適化）
interface MessageContentProps {
  message: Message;
}

const MessageContent = memo(({ message }: MessageContentProps) => {
  const t = useTranslations('chat');
  const [isExpanded, setIsExpanded] = useState(false);
  const contentLength = message.content.length;
  const shouldShowToggle = contentLength > 500; // 500文字以上で折りたたみ表示

  const displayContent =
    shouldShowToggle && !isExpanded
      ? message.content.slice(0, 500) + '...'
      : message.content;

  return (
    <div className="message-content">
      {message.role === 'assistant' ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {displayContent}
        </ReactMarkdown>
      ) : (
        displayContent
      )}

      {shouldShowToggle && (
        <button
          className="text-toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#666',
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              {t('collapse')}
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              {t('readMore')}
            </>
          )}
        </button>
      )}
    </div>
  );
});

MessageContent.displayName = 'MessageContent';

// メッセージアクションボタンコンポーネント（React.memoで最適化）
interface MessageActionsProps {
  message: Message;
  selectedText: string;
  onQuoteSelection: (message: Message) => void;
  onResearch: (message: Message) => void;
  onMessageClick: (message: Message) => void;
  onCreateBranch: (messageId: string) => void;
}

const MessageActions = memo(
  ({
    message,
    selectedText,
    onQuoteSelection,
    onResearch,
    onMessageClick,
    onCreateBranch,
  }: MessageActionsProps) => {
    const t = useTranslations('chat');
    if (message.role !== 'assistant') return null;

    return (
      <div className="message-actions">
        <button
          className="quote-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMessageClick(message);
          }}
          title={t('quoteAll')}
        >
          <Quote size={14} />
          {t('quoteAll')}
        </button>
        <button
          className="quote-selected-btn"
          onClick={(e) => {
            e.stopPropagation();
            onQuoteSelection(message);
          }}
          disabled={!selectedText}
          style={{
            opacity: selectedText ? 1 : 0.3,
            pointerEvents: selectedText ? 'auto' : 'none',
          }}
          title={t('quoteSelected')}
        >
          <Quote size={14} />
          {t('quoteSelected')}
        </button>
        <button
          className="quote-btn"
          onClick={(e) => {
            e.stopPropagation();
            onResearch(message);
          }}
          disabled={!selectedText}
          style={{
            opacity: selectedText ? 1 : 0.3,
            pointerEvents: selectedText ? 'auto' : 'none',
          }}
          title={t('research')}
        >
          <Quote size={14} />
          {t('research')}
        </button>
        <button
          className="branch-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCreateBranch(message.id);
          }}
          title={t('branch')}
        >
          <GitBranch size={14} />
          {t('branch')}
        </button>
      </div>
    );
  }
);

MessageActions.displayName = 'MessageActions';

export default function ChatArea({
  conversation,
  messages,
  isLoading,
  onSendMessage,
  onCreateBranch,
  onToggleTree,
}: ChatAreaProps) {
  const t = useTranslations('chat');
  const [inputValue, setInputValue] = useState('');
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [quotedText, setQuotedText] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [justDeselected, setJustDeselected] = useState(false);
  const [selectedModel, setSelectedModel] = useState('o4-mini');
  const [sendBehavior, setSendBehavior] = useState<'enter' | 'shift-enter'>(
    'enter'
  );
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load saved settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('chatAppSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.aiModel) {
            setSelectedModel(settings.aiModel);
          }
          if (settings.sendBehavior) {
            setSendBehavior(settings.sendBehavior);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();

    // Listen for custom settings update event
    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () =>
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  // 選択状態の監視（selectionchangeイベントを使用）
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
        setJustDeselected(false);
      } else {
        const hadSelection = selectedText.length > 0;
        setSelectedText('');

        // 選択解除が発生した場合、短時間フラグを立てる
        if (hadSelection) {
          setJustDeselected(true);
          setTimeout(() => setJustDeselected(false), 200);
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange);
  }, [selectedText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      // 引用がある場合は引用文を含めてメッセージを構築
      let fullMessage = inputValue.trim();
      if (quotedMessage && quotedText) {
        fullMessage = `> ${quotedText}\n\n${inputValue.trim()}`;
      }

      onSendMessage(
        fullMessage,
        quotedMessage?.id,
        quotedMessage || undefined,
        quotedText || undefined
      );
      setInputValue('');
      setQuotedMessage(null);
      setQuotedText('');
      setSelectedText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleQuoteSelection = (message: Message) => {
    if (selectedText) {
      setQuotedMessage(message);
      setQuotedText(selectedText);
      textareaRef.current?.focus();
    }
  };

  const handleResearch = (message: Message) => {
    if (selectedText) {
      // 調査も通常の引用と同様に、引用文のみをメッセージとして送信
      const fullMessage = `> ${selectedText}`;
      onSendMessage(fullMessage, message.id, message, selectedText);
      setSelectedText('');
    }
  };

  const handleMessageClick = (message: Message) => {
    // 選択解除直後のクリックは無視
    if (justDeselected) return;

    if (message.role === 'assistant' && !selectedText) {
      setQuotedMessage(message);
      setQuotedText(message.content);
      textareaRef.current?.focus();
    }
  };

  const handleClearQuote = () => {
    setQuotedMessage(null);
    setQuotedText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中は送信しない
    if (isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      if (sendBehavior === 'enter') {
        // Enterで送信モード: Shift+Enterなら改行、Enterなら送信
        if (!e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      } else {
        // Shift+Enterで送信モード: Shift+Enterなら送信、Enterなら改行
        if (e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      }
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);

    // Save to localStorage
    try {
      const savedSettings = localStorage.getItem('chatAppSettings');
      let settings = {};
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }
      settings = { ...settings, aiModel: newModel };
      localStorage.setItem('chatAppSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save model setting:', error);
    }
  };

  if (!conversation) {
    return (
      <section className="chat-area">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">
              {t('selectConversation')}
            </h2>
            <p className="text-gray-600">
              {t('selectConversationDescription')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-area">
      <div className="chat-header">
        <h2>{conversation.title}</h2>
        <div className="tree-toggle">
          <button className="btn btn--sm btn--secondary" onClick={onToggleTree}>
            <Eye size={16} />
            {t('treeToggle')}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {t('startNewConversation')}
              </h3>
              <p className="text-gray-600">
                {t('startNewConversationDescription')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? t('you') : t('ai')}
                  </span>
                  <MessageActions
                    message={message}
                    selectedText={selectedText}
                    onQuoteSelection={handleQuoteSelection}
                    onResearch={handleResearch}
                    onMessageClick={handleMessageClick}
                    onCreateBranch={onCreateBranch}
                  />
                </div>
                <MessageContent message={message} />
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-header">
                  <span className="message-role">{t('ai')}</span>
                </div>
                <div className="message-content">
                  <div className="flex items-center gap-2">
                    <div className="loading-spinner"></div>
                    <span>{t('generating')}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-container">
        {quotedMessage && quotedText && (
          <div className="quoted-message">
            <div className="quoted-message-header">
              <Quote size={16} />
              <span>{t('quotedMessage')}</span>
              <button
                className="clear-quote-btn"
                onClick={handleClearQuote}
                title={t('removeQuote')}
              >
                <X size={16} />
              </button>
            </div>
            <div className="quoted-message-content">
              {quotedText.slice(0, 200)}
              {quotedText.length > 200 && '...'}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="form-control"
            placeholder={
              quotedMessage
                ? t('quotedMessageReply')
                : sendBehavior === 'enter'
                  ? t('messageInputEnter')
                  : t('messageInputShiftEnter')
            }
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            disabled={isLoading}
            rows={1}
            style={{ resize: 'none', minHeight: '60px' }}
          />
          <div className="input-controls">
            <select
              value={selectedModel}
              onChange={handleModelChange}
              className="model-select"
              disabled={isLoading}
            >
              <option value="o4-mini">o4-mini</option>
              <option value="o3-mini">o3-mini</option>
              <option value="gpt-4.1">GPT-4.1</option>
            </select>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send size={16} />
              {t('send')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
