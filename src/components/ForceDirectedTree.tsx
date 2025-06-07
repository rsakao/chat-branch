import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import * as d3 from 'd3';
import { Message } from '@/types';

interface ForceDirectedTreeProps {
  messages: Record<string, Message>;
  currentMessages: Message[];
  onSelectMessage: (messageId: string) => void;
}

interface ConversationNode {
  id: string;
  userMessage: Message;
  aiMessage?: Message;
  level: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface TreeLink {
  source: string;
  target: string;
}

interface PopupData {
  node: ConversationNode;
  x: number;
  y: number;
}

export default function ForceDirectedTree({
  messages,
  currentMessages,
  onSelectMessage,
}: ForceDirectedTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ダークモード検出
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDarkMode = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // コンテナサイズの監視
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ResizeObserver) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(400, width),
          height: Math.max(300, height),
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // 現在選択されているメッセージのIDセット
  const currentMessageIds = useMemo(
    () => new Set(currentMessages.map((m) => m.id)),
    [currentMessages]
  );

  // 会話ペアを作成する関数
  const createNodes = useCallback(
    (messages: Record<string, Message>): ConversationNode[] => {
      const nodes: ConversationNode[] = [];
      const processedMessages = new Set<string>();

      // ユーザーメッセージから会話ペアを作成
      const userMessages = Object.values(messages).filter(
        (m) => m.role === 'user'
      );

      userMessages.forEach((userMsg) => {
        if (processedMessages.has(userMsg.id)) return;

        // 対応するAIメッセージを探す
        const aiMessage = userMsg.children
          ?.map((childId) => messages[childId])
          .find((child) => child?.role === 'assistant');

        // レベル計算
        let level = 0;
        if (userMsg.parentId) {
          const parentMsg = messages[userMsg.parentId];
          if (parentMsg?.role === 'assistant') {
            // 親のAIメッセージに対応するユーザーメッセージを探す
            const grandParentUserMsg = Object.values(messages).find(
              (m) => m.role === 'user' && m.children?.includes(parentMsg.id)
            );
            if (grandParentUserMsg) {
              const parentNode = nodes.find(
                (n) => n.userMessage.id === grandParentUserMsg.id
              );
              level = (parentNode?.level || 0) + 1;
            }
          }
        }

        nodes.push({
          id: `pair-${userMsg.id}`,
          userMessage: userMsg,
          aiMessage,
          level,
        });

        processedMessages.add(userMsg.id);
        if (aiMessage) {
          processedMessages.add(aiMessage.id);
        }
      });

      return nodes;
    },
    []
  );

  // リンクを作成する関数
  const createLinks = useCallback(
    (
      nodes: ConversationNode[],
      messages: Record<string, Message>
    ): TreeLink[] => {
      const links: TreeLink[] = [];

      nodes.forEach((node) => {
        if (node.aiMessage?.children) {
          node.aiMessage.children.forEach((childId) => {
            const childMsg = messages[childId];
            if (childMsg?.role === 'user') {
              const childNode = nodes.find((n) => n.userMessage.id === childId);
              if (childNode) {
                links.push({
                  source: node.id,
                  target: childNode.id,
                });
              }
            }
          });
        }
      });

      return links;
    },
    []
  );

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const nodes = createNodes(messages);
    const links = createLinks(nodes, messages);

    if (nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // SVGグループを作成
    const g = svg.append('g');

    // ズーム機能
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: ConversationNode) => d.id)
          .distance(100)
          .strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // ルートノードを中央に固定
    const rootNodes = nodes.filter((n) => n.level === 0);
    rootNodes.forEach((node, index) => {
      node.fx = width / 2 + (index - (rootNodes.length - 1) / 2) * 100;
      node.fy = height / 2;
    });

    // リンクを描画
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', isDarkMode ? '#64748b' : '#94a3b8')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.6);

    // ノードを描画
    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: ConversationNode) => {
        // レベルに応じてサイズを調整
        const baseSize = d.level === 0 ? 25 : d.level === 1 ? 20 : 15;
        const hasChildren =
          d.aiMessage?.children && d.aiMessage.children.length > 0;
        return hasChildren ? baseSize + 5 : baseSize;
      })
      .attr('fill', (d: ConversationNode) => {
        const isActive =
          currentMessageIds.has(d.userMessage.id) ||
          (d.aiMessage && currentMessageIds.has(d.aiMessage.id));

        // レベルと状態に応じて色を決定
        if (d.level === 0) {
          return isActive ? '#1e40af' : '#3b82f6'; // ブルー系
        } else if (d.aiMessage?.children && d.aiMessage.children.length > 0) {
          return isActive ? '#b45309' : '#f59e0b'; // オレンジ系（分岐あり）
        } else {
          return isActive ? '#047857' : '#10b981'; // グリーン系（リーフ）
        }
      })
      .attr('stroke', isDarkMode ? '#1e293b' : '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease');

    // ノードのホバーエフェクト
    node
      .on(
        'mouseenter',
        function (
          event: React.MouseEvent<SVGCircleElement, MouseEvent>,
          d: ConversationNode
        ) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', (d: ConversationNode) => {
              const baseSize = d.level === 0 ? 25 : d.level === 1 ? 20 : 15;
              const hasChildren =
                d.aiMessage?.children && d.aiMessage.children.length > 0;
              return (hasChildren ? baseSize + 5 : baseSize) + 5;
            })
            .attr('stroke-width', 4);

          // ポップアップを表示
          const [x, y] = d3.pointer(event, svgRef.current);
          setPopup({ node: d, x, y });
        }
      )
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d: ConversationNode) => {
            const baseSize = d.level === 0 ? 25 : d.level === 1 ? 20 : 15;
            const hasChildren =
              d.aiMessage?.children && d.aiMessage.children.length > 0;
            return hasChildren ? baseSize + 5 : baseSize;
          })
          .attr('stroke-width', 2);

        // ポップアップを非表示
        setPopup(null);
      })
      .on(
        'click',
        function (
          _event: React.MouseEvent<SVGCircleElement, MouseEvent>,
          d: ConversationNode
        ) {
          // メッセージを選択
          const targetMessageId = d.aiMessage
            ? d.aiMessage.id
            : d.userMessage.id;
          onSelectMessage(targetMessageId);
        }
      );

    // ドラッグ機能
    const drag = d3
      .drag<SVGCircleElement, ConversationNode>()
      .on(
        'start',
        function (
          event: d3.D3DragEvent<SVGCircleElement, ConversationNode, unknown>,
          d: ConversationNode
        ) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
      )
      .on(
        'drag',
        function (
          event: d3.D3DragEvent<SVGCircleElement, ConversationNode, unknown>,
          d: ConversationNode
        ) {
          d.fx = event.x;
          d.fy = event.y;
        }
      )
      .on(
        'end',
        function (
          event: d3.D3DragEvent<SVGCircleElement, ConversationNode, unknown>,
          d: ConversationNode
        ) {
          if (!event.active) simulation.alphaTarget(0);
          // ルートノード以外はドラッグ終了時に固定を解除
          if (d.level !== 0) {
            d.fx = null;
            d.fy = null;
          }
        }
      );

    node.call(drag);

    // シミュレーション更新
    simulation.on('tick', () => {
      link
        .attr('x1', (d: d3.SimulationLinkDatum<ConversationNode>) =>
          typeof d.source === 'object' ? (d.source.x ?? 0) : 0
        )
        .attr('y1', (d: d3.SimulationLinkDatum<ConversationNode>) =>
          typeof d.source === 'object' ? (d.source.y ?? 0) : 0
        )
        .attr('x2', (d: d3.SimulationLinkDatum<ConversationNode>) =>
          typeof d.target === 'object' ? (d.target.x ?? 0) : 0
        )
        .attr('y2', (d: d3.SimulationLinkDatum<ConversationNode>) =>
          typeof d.target === 'object' ? (d.target.y ?? 0) : 0
        );

      node
        .attr('cx', (d: ConversationNode) => d.x ?? 0)
        .attr('cy', (d: ConversationNode) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
    };
  }, [
    messages,
    currentMessageIds,
    dimensions,
    isDarkMode,
    createNodes,
    createLinks,
    onSelectMessage,
  ]);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          background: isDarkMode ? '#1e293b' : '#f8fafc',
          borderRadius: '8px',
        }}
      />

      {/* ポップアップ */}
      {popup && (
        <div
          style={{
            position: 'absolute',
            left: popup.x + 10,
            top: popup.y - 10,
            background: isDarkMode ? '#374151' : 'white',
            color: isDarkMode ? '#f3f4f6' : '#1f2937',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '300px',
            zIndex: 1000,
            fontSize: '12px',
            border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            👤 User:
          </div>
          <div style={{ marginBottom: '8px', lineHeight: '1.4' }}>
            {truncateText(popup.node.userMessage.content, 150)}
          </div>
          {popup.node.aiMessage && (
            <>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                🤖 AI:
              </div>
              <div style={{ lineHeight: '1.4' }}>
                {truncateText(popup.node.aiMessage.content, 150)}
              </div>
            </>
          )}
        </div>
      )}

      {/* 凡例 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: isDarkMode ? '#374151' : 'white',
          color: isDarkMode ? '#f3f4f6' : '#1f2937',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          fontSize: '12px',
          border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#3b82f6',
              marginRight: '8px',
            }}
          />
          Root
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#f59e0b',
              marginRight: '8px',
            }}
          />
          Branch
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#10b981',
              marginRight: '8px',
            }}
          />
          Leaf
        </div>
      </div>
    </div>
  );
}
