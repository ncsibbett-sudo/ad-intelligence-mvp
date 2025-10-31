# Contributing to Ad Intelligence

Thank you for your interest in contributing to Ad Intelligence! This document provides guidelines and instructions for development.

## Development Setup

### Prerequisites

- Node.js 20.x (use `nvm` or `fnm` to install: `nvm use`)
- npm 10.x or later
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/ncsibbett-sudo/ad-intelligence-mvp.git
   cd ad-intelligence-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local` or create one with required credentials
   - See `docs/CLAUDE.md` for environment variable details

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Before You Code

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run validation checks**
   ```bash
   npm run validate
   ```
   This runs type-checking, linting, and format checking.

### While You Code

- **Auto-format on save** - Your editor should be configured with EditorConfig and Prettier
- **Check types frequently** - Run `npm run type-check` to catch TypeScript errors
- **Run linter** - Use `npm run lint:fix` to auto-fix linting issues

### Before You Commit

1. **Format code**
   ```bash
   npm run format
   ```

2. **Run all checks**
   ```bash
   npm run validate
   ```

3. **Test locally**
   ```bash
   npm run build
   npm start
   ```

### Commit Guidelines

We follow conventional commit format:

```
type(scope): subject

body (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(api): correct webhook signature verification"
git commit -m "docs: update API endpoint documentation"
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Prefer interfaces over types for object shapes
- Use optional chaining (`?.`) and nullish coalescing (`??`)

**Good:**
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
}

const userName = user?.name ?? 'Anonymous';
```

**Avoid:**
```typescript
const user: any = { ... };  // Don't use 'any'
const name = user && user.name ? user.name : 'Anonymous';  // Use ?. and ??
```

### React Components

- Use functional components with hooks
- Name components in PascalCase
- Extract reusable logic into custom hooks
- Keep components small and focused

**Good:**
```typescript
export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  // Component logic

  return <div>...</div>;
}
```

### API Routes

- All API routes must validate authentication
- Use proper HTTP status codes
- Return consistent error format
- Log errors for debugging

**Pattern:**
```typescript
export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Route logic
}
```

## Project Structure

```
ad-intelligence/
├── app/               # Next.js App Router
│   ├── api/          # API routes
│   ├── auth/         # Authentication pages
│   └── dashboard/    # Protected pages
├── lib/               # Shared utilities
│   ├── ai/           # AI analysis
│   ├── meta/         # Meta API client
│   ├── supabase/     # Database client
│   └── types.ts      # TypeScript types
├── docs/              # Documentation
└── Configuration files
```

## Testing (Future)

We don't have tests yet, but when we add them:

```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Deployment

The application auto-deploys to Vercel when changes are pushed to `main`.

- **Production**: https://ad-intelligence-mvp.vercel.app
- **Preview**: Automatic for all PRs

## Getting Help

- Review existing code for patterns and examples
- Check `docs/` folder for detailed documentation
- Open an issue for questions or bugs
- Reach out to maintainers

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Thank you for contributing to Ad Intelligence!
