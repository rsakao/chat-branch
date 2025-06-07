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

interface TreeNodeDatum {
  id: string;
  userMessage: Message;
  aiMessage?: Message;
  children?: TreeNodeDatum[];
  level: number;
}

interface PopupData {
  node: TreeNodeDatum;
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
  const [treeKey, setTreeKey] = useState(0); // ツリーの強制再レンダリング用

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

  // メッセージが変更された時にツリーを強制再描画
  useEffect(() => {
    setTreeKey((prev) => prev + 1);
  }, [messages]);

  // メッセージからツリー構造を作成
  const buildTree = useCallback(
    (messages: Record<string, Message>): TreeNodeDatum | null => {
      // ルートメッセージ（parentIdがないuser）を探す
      const userMessages = Object.values(messages).filter(
        (m) => m.role === 'user'
      );
      const rootUser = userMessages.find((m) => !m.parentId);
      if (!rootUser) return null;

      // 再帰的にツリーを構築
      const buildNode = (userMsg: Message, level: number): TreeNodeDatum => {
        // 対応するAIメッセージ
        const aiMessage = userMsg.children
          ?.map((childId) => messages[childId])
          .find((child) => child?.role === 'assistant');
        // 子ノード（AIメッセージの子のuser）
        let children: TreeNodeDatum[] = [];
        if (aiMessage?.children) {
          children = aiMessage.children
            .map((childId) => messages[childId])
            .filter((m): m is Message => !!m && m.role === 'user')
            .map((childUserMsg) => buildNode(childUserMsg, level + 1));
        }
        return {
          id: `pair-${userMsg.id}`,
          userMessage: userMsg,
          aiMessage,
          children: children.length > 0 ? children : undefined,
          level,
        };
      };
      return buildNode(rootUser, 0);
    },
    []
  );

  // D3 tree layout
  useEffect(() => {
    if (!svgRef.current) return;
    const root = buildTree(messages);
    if (!root) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dimensions;
    // d3.hierarchyに変換
    const hierarchyRoot = d3.hierarchy<TreeNodeDatum>(root, (d) => d.children);
    // tree layout
    const treeLayout = d3.tree<TreeNodeDatum>().size([width - 80, height - 80]);
    treeLayout(hierarchyRoot);
    // ズーム機能
    const g = svg.append('g').attr('transform', `translate(40,40)`);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    // エッジ描画
    g.append('g')
      .selectAll('path')
      .data(hierarchyRoot.links())
      .enter()
      .append('path')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr(
        'd',
        d3
          .linkVertical()
          .x((d: any) => d.x)
          .y((d: any) => d.y) as any
      )
      .attr('fill', 'none')
      .attr('stroke', isDarkMode ? '#64748b' : '#94a3b8')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.6);
    // ノード描画
    const node = g
      .append('g')
      .selectAll('circle')
      .data(hierarchyRoot.descendants())
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => {
        const node = d.data;
        const baseSize = node.level === 0 ? 25 : node.level === 1 ? 20 : 15;
        const hasChildren = node.children && node.children.length > 0;
        return hasChildren ? baseSize + 5 : baseSize;
      })
      .attr('fill', (d) => {
        const node = d.data;
        const isActive =
          currentMessageIds.has(node.userMessage.id) ||
          (node.aiMessage && currentMessageIds.has(node.aiMessage.id));
        if (node.level === 0) {
          return isActive ? '#1e40af' : '#3b82f6';
        } else if (node.children && node.children.length > 0) {
          return isActive ? '#b45309' : '#f59e0b';
        } else {
          return isActive ? '#047857' : '#10b981';
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
        function (event, d: d3.HierarchyPointNode<TreeNodeDatum>) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', () => {
              const node = d.data;
              const baseSize =
                node.level === 0 ? 25 : node.level === 1 ? 20 : 15;
              const hasChildren = node.children && node.children.length > 0;
              return (hasChildren ? baseSize + 5 : baseSize) + 5;
            })
            .attr('stroke-width', 4);
          // ポップアップを表示
          setPopup({ node: d.data, x: d.x + 50, y: d.y });
        }
      )
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d: d3.HierarchyPointNode<TreeNodeDatum>) => {
            const node = d.data;
            const baseSize = node.level === 0 ? 25 : node.level === 1 ? 20 : 15;
            const hasChildren = node.children && node.children.length > 0;
            return hasChildren ? baseSize + 5 : baseSize;
          })
          .attr('stroke-width', 2);
        setPopup(null);
      })
      .on('click', function (_event, d: d3.HierarchyPointNode<TreeNodeDatum>) {
        const targetMessageId = d.data.aiMessage
          ? d.data.aiMessage.id
          : d.data.userMessage.id;
        onSelectMessage(targetMessageId);
      });
  }, [
    messages,
    currentMessageIds,
    dimensions,
    isDarkMode,
    buildTree,
    onSelectMessage,
    treeKey,
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
    </div>
  );
}
