# Chat Branch

[English](README.md) | [日本語](README.ja.md)

A chat application with conversation branching features using OpenAI API. Like ChatGPT, but you can branch conversations to explore multiple topics in parallel.

## Key Features

- **Conversation Branching**: Create new conversation flows from any message
- **Tree Visualization**: Visualize conversation structure (Simple & Advanced view)
- **Conversation Management**: Manage and switch between multiple conversations
- **Real-time AI Response**: Real-time responses using OpenAI API
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-language Support**: Japanese and English UI

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Database**: SQLite (Local) / PostgreSQL (Production)
- **ORM**: Prisma
- **AI**: OpenAI API (GPT-4o-mini)
- **UI Components**: Lucide React, React Hot Toast
- **Tree Visualization**: React Flow
- **Internationalization**: next-intl

## 🗄️ Database Configuration

### Local Development (SQLite)

```bash
DATABASE_URL="file:./dev.db"
```

### Production Environment (PostgreSQL)

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🔄 Automatic Schema Switching

The application automatically switches database providers based on `DATABASE_URL`:

- SQLite: `DATABASE_URL="file:./dev.db"`
- PostgreSQL: `DATABASE_URL="postgresql://..."`

Schema files are automatically selected, no manual switching required.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

#### Local Development

Create a `.env` file and set the following environment variables:

> **Important**: Prisma reads `.env` files by default. Using `.env.local` will prevent Prisma from reading database connection information.

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (Local Development - SQLite)
DATABASE_URL="file:./dev.db"
```

> **Note**: Make sure the `.env` file is included in `.gitignore` as it contains sensitive information.

#### Production Environment (Vercel + PostgreSQL)

Add the following in Vercel environment variables:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (Production - PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### 3. Database Initialization

#### Local Development (SQLite)

```bash
npx prisma generate
npx prisma db push
```

#### Production Environment (PostgreSQL)

```bash
# Create migration
npx prisma migrate dev --name init

# Deploy migration to production
npx prisma migrate deploy
```

### 4. Start Application

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

## Deployment

### Deploy to Vercel

1. **Create Vercel Project**

   ```bash
   npm i -g vercel
   vercel
   ```

2. **Prepare PostgreSQL Database**

   - Use services like Vercel Postgres, Supabase, PlanetScale, etc.
   - Obtain database connection URL

3. **Set Environment Variables**

   - Set the following environment variables in Vercel dashboard:
     - `OPENAI_API_KEY`: OpenAI API key
     - `DATABASE_URL`: PostgreSQL connection URL

4. **Configure Build Commands**

   - Recommended to add the following to package.json for automatic migration execution:

   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build",
       "vercel-build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment-specific Configuration Switching

The application automatically switches database providers based on `DATABASE_URL`:

- SQLite: `DATABASE_URL="file:./dev.db"` (Local development)
- PostgreSQL: `DATABASE_URL="postgresql://..."` (Production)

## Usage

### Basic Usage

1. **Create New Conversation**: Click "New Conversation" button in the left sidebar
2. **Send Message**: Enter message in the text area at the bottom and send
3. **Branch Conversation**: Click "Branch" button on any message to start a new topic
4. **Tree View**: Check and navigate conversation structure in the right sidebar

### Branching Feature

- Create new conversation flows from any message
- Branched conversations proceed independently and you can return to the original conversation
- Understand the overall structure with tree visualization

### Tree Display Modes

- **Auto Select**: Choose the optimal display method based on message count
- **Simple View**: Text-based hierarchical display
- **Advanced View**: Interactive node display using React Flow

### Language Settings

- Switch between Japanese and English in Settings
- Language preference is saved locally

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/          # Chat API
│   │   └── conversations/ # Conversation Management API
│   ├── globals.css        # Global Styles
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Main Page
├── components/            # React Components
│   ├── ChatArea.tsx       # Chat Area
│   ├── ConversationSidebar.tsx # Conversation Sidebar
│   ├── ReactFlowTree.tsx  # React Flow Tree
│   ├── SettingsModal.tsx  # Settings Modal
│   ├── TreeView.tsx       # Tree View
│   ├── LocaleProvider.tsx # Internationalization Provider
│   └── LanguageSelector.tsx # Language Selector
├── hooks/                 # Custom Hooks
│   ├── useChat.ts         # Chat Functionality
│   ├── useConversations.ts # Conversation Management
│   └── useLocale.ts       # Language Management
├── i18n/                  # Internationalization
│   ├── config.ts          # i18n Configuration
│   ├── request.ts         # next-intl Configuration
│   └── messages/          # Translation Files
│       ├── en.json        # English
│       └── ja.json        # Japanese
├── types/                 # TypeScript Type Definitions
│   └── index.ts
└── utils/                 # Utility Functions
    └── helpers.ts
```

## Development

### Adding New Features

1. Add type definitions to `src/types/index.ts`
2. Create API routes in `src/app/api/` as needed
3. Add components to `src/components/`
4. Add custom hooks to `src/hooks/`
5. Add translation keys to `src/i18n/messages/`

### Database Schema Changes

#### Local Development

```bash
# After editing schema
npx prisma db push
npx prisma generate
```

#### Production Environment

```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Apply to production
npx prisma migrate deploy
```

### Adding Translations

1. Add translation keys to `src/i18n/messages/en.json` and `src/i18n/messages/ja.json`
2. Use `useTranslations` hook in components
3. Test language switching functionality

## Troubleshooting

### Database Issues

- **SQLite not working locally**: Verify `DATABASE_URL="file:./dev.db"` is correctly set
- **PostgreSQL not working on Vercel**: Verify correct PostgreSQL URL is set
- **Migration errors**: Always use `prisma migrate deploy` in production, never use `prisma db push`

### Environment Variables

- Local: `.env` file
- Vercel: Environment variables in dashboard
- Production requires `OPENAI_API_KEY` and `DATABASE_URL`

### Internationalization Issues

- **Translations not loading**: Check if translation files exist and have correct syntax
- **Language not switching**: Verify localStorage is accessible and page reloads properly

## License

MIT License

## Contributing

Pull requests and issue reports are welcome.
