# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "AI分岐チャット" (AI Branching Chat) - a Next.js application that enables branching conversations with AI. Users can fork conversations at any message to explore different discussion paths, visualized through an interactive tree interface.

## Development Commands

```bash
# Setup and dependencies
npm install
npx prisma generate && npx prisma db push

# Development
npm run dev          # Start development server with Turbopack
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint checking

# Database
npx prisma studio   # Open Prisma database browser
npx prisma generate # Regenerate Prisma client after schema changes
```

## Architecture Overview

### Core Data Model
- **Messages**: Tree structure with parent-child relationships enabling conversation branching
- **Conversations**: Container with title, currentPath (active message thread), and rootMessageId
- **Database**: SQLite with Prisma ORM, stored as graph/tree not linear arrays

### Key Components Architecture
- **`ChatArea.tsx`**: Central chat interface with message display and branching controls
- **`useChat.ts`**: Core hook managing message tree traversal, branching logic, and API calls
- **`TreeView.tsx`**: Adaptive visualization (simple text vs React Flow graph based on message count)
- **`ReactFlowTree.tsx`**: Interactive conversation tree with animations and navigation

### API Structure
- `/api/chat`: OpenAI integration with quote/reference support
- `/api/conversations/[id]/messages`: Message CRUD with tree relationship management
- `/api/conversations`: Conversation management and listing

## Important Technical Patterns

### Message Tree Navigation
Messages are stored as a graph structure. The `currentPath` in conversations tracks the active message thread. When branching, new messages become children of existing messages, creating multiple conversation paths.

### Quote/Reference System
The application includes sophisticated prompt engineering in `src/utils/prompts.ts` that allows users to quote specific text from previous messages for enhanced context-aware AI responses.

### Styling System
Uses CSS custom properties for comprehensive theming with dark mode support. Global styles in `globals.css` include extensive markdown styling for code blocks, lists, and quotes.

### Type Definitions
Core types in `src/types/index.ts` define the message tree structure, conversation metadata, and React Flow visualization types.

## Environment Setup

Required environment variable:
```
OPENAI_API_KEY=your_openai_api_key
```

## Key Development Notes

- Messages use tree relationships (parentId, children arrays) not linear ordering
- Conversation state managed through React hooks, no external state management
- React Flow used for efficient rendering of large conversation trees
- All API routes handle tree structure operations and path management
- Custom prompt engineering integrates quoted text into AI context