# ThisOrThat Technical Specifications

## Overview

This document provides detailed technical specifications for implementing the ThisOrThat MVP using Next.js 14+, Supabase, and Vercel. The architecture follows a Jamstack approach with serverless functions and real-time capabilities.

## Technology Stack

### Frontend

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript 5.3+
- **Styling:** Tailwind CSS 3.4+
- **UI Components:** Shadcn/ui (Radix UI + Tailwind)
- **State Management:** React Context + Hooks
- **Testing:** Vitest + React Testing Library + Playwright

### Backend

- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth (OAuth)
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **API:** Next.js API Routes (Serverless)
- **Hosting:** Vercel

### Development Tools

- **Package Manager:** npm 9+
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode
- **Git Hooks:** Husky + lint-staged

## Project Structure

```
thisorthat/
├── apps/
│   └── web/                          # Next.js application
│       ├── src/
│       │   ├── app/                  # App Router
│       │   │   ├── (auth)/           # Auth routes
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── signup/
│       │   │   │       └── page.tsx
│       │   │   ├── (main)/           # Main app routes
│       │   │   │   ├── layout.tsx    # Main layout
│       │   │   │   ├── page.tsx      # Home/feed
│       │   │   │   ├── poll/
│       │   │   │   │   ├── [id]/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── create/
│       │   │   │   │       └── page.tsx
│       │   │   │   └── profile/
│       │   │   │       └── page.tsx
│       │   │   ├── api/              # API routes
│       │   │   │   ├── polls/
│       │   │   │   │   ├── route.ts
│       │   │   │   │   └── [id]/
│       │   │   │   │       ├── route.ts
│       │   │   │   │       ├── vote/
│       │   │   │   │       │   └── route.ts
│       │   │   │   │       └── comments/
│       │   │   │   │           └── route.ts
│       │   │   │   └── auth/
│       │   │   │       └── callback/
│       │   │   │           └── route.ts
│       │   │   ├── layout.tsx        # Root layout
│       │   │   └── page.tsx          # Landing page
│       │   ├── components/           # React components
│       │   │   ├── ui/               # Shadcn/ui components
│       │   │   ├── poll/             # Poll-specific components
│       │   │   │   ├── PollCard.tsx
│       │   │   │   ├── PollCreator.tsx
│       │   │   │   ├── PollViewer.tsx
│       │   │   │   └── VoteButton.tsx
│       │   │   ├── comments/
│       │   │   │   ├── CommentList.tsx
│       │   │   │   └── CommentForm.tsx
│       │   │   └── layout/
│       │   │       ├── Header.tsx
│       │   │       └── Footer.tsx
│       │   ├── lib/                  # Utilities and services
│       │   │   ├── supabase/
│       │   │   │   ├── client.ts     # Client-side Supabase
│       │   │   │   └── server.ts     # Server-side Supabase
│       │   │   ├── services/         # API service layer
│       │   │   │   ├── polls.ts
│       │   │   │   ├── votes.ts
│       │   │   │   └── comments.ts
│       │   │   └── utils/
│       │   │       ├── date.ts
│       │   │       └── validation.ts
│       │   ├── hooks/                # Custom React hooks
│       │   │   ├── useAuth.ts
│       │   │   ├── usePoll.ts
│       │   │   └── useRealtime.ts
│       │   └── types/                # TypeScript types
│       │       ├── poll.ts
│       │       ├── vote.ts
│       │       └── comment.ts
│       ├── public/                   # Static assets
│       ├── tests/                    # Tests
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── .env.local.example
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                       # Shared types/utilities
│       ├── src/
│       │   ├── types/                # Shared TypeScript types
│       │   ├── constants/            # Shared constants
│       │   └── utils/                # Shared utilities
│       ├── tsconfig.json
│       └── package.json
├── supabase/                         # Supabase configuration
│   ├── migrations/                   # Database migrations
│   │   └── 20250127_initial_schema.sql
│   ├── functions/                    # Edge functions (future)
│   ├── config.toml                   # Supabase config
│   └── seed.sql                      # Seed data
├── .env.example                      # Environment template
├── .gitignore
├── package.json                      # Root package.json
├── tsconfig.json                     # Root TypeScript config
└── README.md
```

## Database Schema

### Tables

#### polls

```sql
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_a_image_url TEXT NOT NULL,
  option_a_label TEXT,
  option_b_image_url TEXT NOT NULL,
  option_b_label TEXT,
  description TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  is_public BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### votes

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT, -- For anonymous voters (cookie/session based)
  choice TEXT NOT NULL CHECK (choice IN ('option_a', 'option_b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, user_id), -- One vote per user per poll
  UNIQUE(poll_id, anonymous_id) -- One vote per anonymous user per poll
);
```

#### comments

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### poll_shares

```sql
CREATE TABLE poll_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Can't share same poll to same user twice
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_polls_creator ON polls(creator_id);
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_expires ON polls(expires_at);
CREATE INDEX idx_votes_poll ON votes(poll_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_comments_poll ON comments(poll_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_poll_shares_poll ON poll_shares(poll_id);
CREATE INDEX idx_poll_shares_user ON poll_shares(user_id);
```

### Row Level Security (RLS) Policies

#### Polls Policies

```sql
-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Public polls are viewable by everyone
CREATE POLICY "Public polls are viewable by everyone"
  ON polls FOR SELECT
  USING (is_public = true OR status = 'active');

-- Private polls viewable by creator and shared users
CREATE POLICY "Private polls viewable by creator and shared users"
  ON polls FOR SELECT
  USING (
    is_public = false AND (
      creator_id = auth.uid() OR
      id IN (SELECT poll_id FROM poll_shares WHERE user_id = auth.uid())
    )
  );

-- Users can create polls
CREATE POLICY "Users can create polls"
  ON polls FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Users can update their own polls
CREATE POLICY "Users can update their own polls"
  ON polls FOR UPDATE
  USING (auth.uid() = creator_id);
```

#### Votes Policies

```sql
-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes for accessible polls
CREATE POLICY "Anyone can view votes for accessible polls"
  ON votes FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM polls WHERE
        is_public = true OR
        creator_id = auth.uid() OR
        id IN (SELECT poll_id FROM poll_shares WHERE user_id = auth.uid())
    )
  );

-- Anyone can vote on accessible polls
CREATE POLICY "Anyone can vote on accessible polls"
  ON votes FOR INSERT
  WITH CHECK (
    poll_id IN (
      SELECT id FROM polls WHERE
        status = 'active' AND
        expires_at > NOW() AND
        (is_public = true OR
         creator_id = auth.uid() OR
         id IN (SELECT poll_id FROM poll_shares WHERE user_id = auth.uid()))
    )
  );

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  USING (user_id = auth.uid());
```

## API Specifications

### REST API Endpoints

#### GET /api/polls

List polls accessible to the user

```typescript
// Query Parameters
interface ListPollsParams {
  status?: "active" | "closed";
  limit?: number; // default: 20
  offset?: number; // default: 0
}

// Response
interface ListPollsResponse {
  polls: Poll[];
  total: number;
}
```

#### POST /api/polls

Create a new poll

```typescript
// Request (multipart/form-data)
interface CreatePollRequest {
  option_a_image: File;
  option_b_image: File;
  option_a_label?: string;
  option_b_label?: string;
  description?: string;
  is_public?: boolean;
}

// Response
interface CreatePollResponse extends Poll {}
```

#### GET /api/polls/[id]

Get a specific poll with results

```typescript
// Response
interface PollWithResults extends Poll {
  vote_counts: {
    option_a: number;
    option_b: number;
  };
  user_vote: "option_a" | "option_b" | null;
}
```

#### POST /api/polls/[id]/vote

Submit a vote for a poll

```typescript
// Request
interface VoteRequest {
  choice: "option_a" | "option_b";
}

// Response
interface VoteResponse extends Vote {}
```

#### GET /api/polls/[id]/comments

Get comments for a poll

```typescript
// Response
interface CommentsResponse {
  comments: Comment[];
}
```

#### POST /api/polls/[id]/comments

Add a comment to a poll

```typescript
// Request
interface CreateCommentRequest {
  content: string;
  parent_id?: string;
}

// Response
interface CreateCommentResponse extends Comment {}
```

## TypeScript Types

### Core Types

```typescript
// types/poll.ts
export type PollStatus = "active" | "closed" | "deleted";

export interface Poll {
  id: string;
  creator_id: string;
  option_a_image_url: string;
  option_a_label: string | null;
  option_b_image_url: string;
  option_b_label: string | null;
  description: string | null;
  expires_at: string;
  is_public: boolean;
  status: PollStatus;
  created_at: string;
  updated_at: string;
}

export interface PollWithResults extends Poll {
  vote_counts: {
    option_a: number;
    option_b: number;
  };
  user_vote: "option_a" | "option_b" | null;
}

export interface CreatePollInput {
  option_a_image: File;
  option_b_image: File;
  option_a_label?: string;
  option_b_label?: string;
  description?: string;
  is_public?: boolean;
}
```

```typescript
// types/vote.ts
export type VoteChoice = "option_a" | "option_b";

export interface Vote {
  id: string;
  poll_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  choice: VoteChoice;
  created_at: string;
}

export interface VoteCounts {
  option_a: number;
  option_b: number;
  total: number;
}
```

```typescript
// types/comment.ts
export interface Comment {
  id: string;
  poll_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface CreateCommentInput {
  content: string;
  parent_id?: string;
}
```

## Component Architecture

### Core Components

#### PollCreator

```typescript
// components/poll/PollCreator.tsx
'use client';

import { useState } from 'react';
import { CreatePollInput } from '@/types/poll';
import { pollService } from '@/lib/services/polls';

export function PollCreator() {
  const [formData, setFormData] = useState<Partial<CreatePollInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreatePollInput) => {
    setIsSubmitting(true);
    try {
      const poll = await pollService.createPoll(data);
      // Redirect to poll page
      router.push(`/poll/${poll.id}`);
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### PollViewer

```typescript
// components/poll/PollViewer.tsx
'use client';

import { useEffect, useState } from 'react';
import { PollWithResults } from '@/types/poll';
import { useRealtime } from '@/hooks/useRealtime';

export function PollViewer({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<PollWithResults | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Real-time updates
  useRealtime(`polls:${pollId}`, (payload) => {
    if (payload.eventType === 'UPDATE') {
      setPoll(payload.new);
    }
  });

  const handleVote = async (choice: 'option_a' | 'option_b') => {
    setIsVoting(true);
    try {
      await pollService.vote(pollId, choice);
      // Optimistic update
      setPoll(prev => prev ? {
        ...prev,
        vote_counts: {
          ...prev.vote_counts,
          [choice]: prev.vote_counts[choice] + 1
        },
        user_vote: choice
      } : null);
    } catch (error) {
      // Handle error
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="poll-viewer">
      {/* Poll display and voting interface */}
    </div>
  );
}
```

## Service Layer

### Poll Service

```typescript
// lib/services/polls.ts
import { apiClient } from "./api-client";
import { Poll, PollWithResults, CreatePollInput } from "@/types/poll";

export const pollService = {
  async getPolls(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const queryString = new URLSearchParams(params as any).toString();
    return apiClient.get<{ polls: Poll[]; total: number }>(
      `/polls${queryString ? `?${queryString}` : ""}`,
    );
  },

  async getPoll(pollId: string) {
    return apiClient.get<PollWithResults>(`/polls/${pollId}`);
  },

  async createPoll(data: CreatePollInput) {
    const formData = new FormData();
    formData.append("option_a_image", data.option_a_image);
    formData.append("option_b_image", data.option_b_image);
    if (data.option_a_label)
      formData.append("option_a_label", data.option_a_label);
    if (data.option_b_label)
      formData.append("option_b_label", data.option_b_label);
    if (data.description) formData.append("description", data.description);
    formData.append("is_public", String(data.is_public || false));

    const response = await fetch("/api/polls", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to create poll");
    }

    return response.json();
  },

  async vote(pollId: string, choice: "option_a" | "option_b") {
    return apiClient.post(`/polls/${pollId}/vote`, { choice });
  },
};
```

## Authentication Setup

### Supabase Client Configuration

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();
```

```typescript
// lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const supabase = createServerComponentClient({ cookies });
```

### Auth Context

```typescript
// hooks/useAuth.ts
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (provider: 'google' | 'facebook') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Real-time Implementation

### Real-time Hook

```typescript
// hooks/useRealtime.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export function useRealtime(channel: string, callback: (payload: any) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: channel.split(":")[0],
          filter: `id=eq.${channel.split(":")[1]}`,
        },
        (payload) => {
          callbackRef.current(payload);
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel]);
}
```

## Environment Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Next.js Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["your-project.supabase.co"],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
```

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/components/PollCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PollCard } from '@/components/poll/PollCard';
import { Poll } from '@/types/poll';

describe('PollCard', () => {
  const mockPoll: Poll = {
    id: '123',
    creator_id: 'user1',
    option_a_image_url: '/a.jpg',
    option_a_label: 'Option A',
    option_b_image_url: '/b.jpg',
    option_b_label: 'Option B',
    description: 'Test poll',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    is_public: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders poll options', () => {
    render(<PollCard poll={mockPoll} />);

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Test poll')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// tests/integration/poll-creation.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PollCreator } from '@/components/poll/PollCreator';
import { pollService } from '@/lib/services/polls';

// Mock the service
jest.mock('@/lib/services/polls');

describe('Poll Creation Flow', () => {
  it('creates a poll successfully', async () => {
    const mockCreatePoll = jest.fn().mockResolvedValue({ id: '123' });
    (pollService.createPoll as jest.Mock).mockImplementation(mockCreatePoll);

    render(<PollCreator />);

    // Fill out form
    fireEvent.change(screen.getByLabelText('Option A Label'), {
      target: { value: 'Pizza' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Create Poll'));

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith({
        option_a_image: expect.any(File),
        option_b_image: expect.any(File),
        option_a_label: 'Pizza',
      });
    });
  });
});
```

### E2E Tests

```typescript
// tests/e2e/poll-lifecycle.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Poll Lifecycle", () => {
  test("user can create and vote on a poll", async ({ page, context }) => {
    // Login
    await page.goto("/login");
    await page.click("text=Sign in with Google");
    // ... handle OAuth flow ...

    // Create poll
    await page.goto("/poll/create");
    await page.setInputFiles(
      'input[name="option_a_image"]',
      "tests/fixtures/a.jpg",
    );
    await page.setInputFiles(
      'input[name="option_b_image"]',
      "tests/fixtures/b.jpg",
    );
    await page.fill('input[name="description"]', "E2E Test Poll");
    await page.click('button[type="submit"]');

    // Verify redirect to poll page
    await expect(page).toHaveURL(/\/poll\/[a-z0-9-]+/);
    await expect(page.locator("text=E2E Test Poll")).toBeVisible();

    // Vote on poll
    await page.click('button:has-text("Option A")');
    await expect(page.locator("text=Vote recorded")).toBeVisible();

    // Verify vote count updated
    await expect(page.locator("text=1 vote")).toBeVisible();
  });
});
```

## Deployment Configuration

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  }
}
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

## Performance Optimization

### Image Optimization

```typescript
// components/ui/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function OptimizedImage({ src, alt, width, height, className }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
}
```

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const PollCreator = dynamic(() => import('@/components/poll/PollCreator'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

## Security Considerations

### Input Validation

```typescript
// lib/utils/validation.ts
import { z } from "zod";

export const createPollSchema = z.object({
  option_a_label: z.string().max(50).optional(),
  option_b_label: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
});

export const voteSchema = z.object({
  choice: z.enum(["option_a", "option_b"]),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(500),
  parent_id: z.string().uuid().optional(),
});
```

### Rate Limiting

```typescript
// lib/utils/rate-limit.ts
import { NextRequest } from "next/server";

const rateLimitMap = new Map();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60000,
) {
  const now = Date.now();
  const windowStart = now - window;

  const requests = rateLimitMap.get(identifier) || [];
  const validRequests = requests.filter((time: number) => time > windowStart);

  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  return true;
}
```

This technical specification provides a comprehensive guide for implementing the ThisOrThat MVP with Next.js, Supabase, and Vercel. The architecture is designed for scalability, performance, and maintainability while meeting all the requirements outlined in the PRD.
