# Chat Branch Development Container

This devcontainer configuration provides a complete development environment for the Chat Branch application with GitHub Codespaces support.

## Features

- **Node.js 22**: Latest LTS version with TypeScript support
- **SQLite Database**: Pre-configured for immediate development
- **VS Code Extensions**: Essential extensions for Next.js, TypeScript, Prisma, and TailwindCSS development
- **Automatic Setup**: Dependencies and database initialization on container creation

## Included VS Code Extensions

- TypeScript and JavaScript language support
- Tailwind CSS IntelliSense
- Prisma syntax highlighting and formatting
- Prettier code formatting
- ESLint for code quality
- Auto Rename Tag for HTML/JSX
- JSON and Markdown support

## Getting Started

### With GitHub Codespaces

1. Navigate to this repository on GitHub
2. Click the "Code" button and select "Codespaces"
3. Click "Create codespace on main" (or your desired branch)
4. Wait for the container to build and initialize
5. Once ready, start the development server:
   ```bash
   npm run dev
   ```
6. The application will be available at the forwarded port (typically port 3000)

### With VS Code Dev Containers Extension

1. Install the "Dev Containers" extension in VS Code
2. Open this repository in VS Code
3. When prompted, click "Reopen in Container" or use Command Palette: "Dev Containers: Reopen in Container"
4. Wait for the container to build and initialize
5. Start development with `npm run dev`

## Environment Configuration

The devcontainer automatically sets up:

- `DATABASE_URL=file:./dev.db` for SQLite database
- `NODE_ENV=development` for development mode
- Persistent node_modules volume for improved performance

## Database Setup

The devcontainer automatically:

1. Installs all npm dependencies
2. Generates Prisma client
3. Pushes the database schema to SQLite

No additional database setup is required!

## Development Workflow

```bash
# Start the development server
npm run dev

# Run database operations
npx prisma studio  # Database browser
npx prisma generate  # Regenerate client
npx prisma db push   # Push schema changes

# Code quality
npm run lint        # ESLint
npm run format      # Prettier formatting
npm run build       # Production build
```

## Troubleshooting

- **Port forwarding issues**: Ensure port 3000 is properly forwarded in your Codespaces settings
- **Database issues**: Run `npx prisma db push` to reset the database schema
- **Dependency issues**: Delete `node_modules` and run `npm install` again