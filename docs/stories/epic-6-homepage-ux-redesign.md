# Epic 6: Homepage UX Redesign - Brownfield Enhancement

## Epic Goal

Transform the ThisOrThat homepage from a static feature description page into an interactive "live demo poll" experience that demonstrates the product value within 3 seconds, eliminating the ironic decision paralysis caused by the current complex homepage design.

## Epic Description

### Existing System Context

**Current relevant functionality:**
- Homepage exists at `apps/web/src/app/page.tsx` with static hero section, features grid, and multiple CTAs
- Existing poll viewing and voting components in `src/components/poll/`
- Real-time voting system already implemented with Supabase Realtime
- Component library using Shadcn/ui with Tailwind CSS
- Mobile-responsive layout with Next.js App Router

**Technology stack:**
- Frontend: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Realtime, Auth, Storage)
- Deployment: Vercel Edge Network
- Testing: Vitest, React Testing Library, Playwright

**Integration points:**
- Replaces `/apps/web/src/app/page.tsx` (landing page)
- Reuses existing poll components (`PollViewer`, `PollCard`, `VoteButton`)
- Integrates with existing real-time voting system
- Connects to existing poll API routes (`/api/polls`)
- Uses existing Supabase Realtime subscriptions

### Enhancement Details

**What's being added/changed:**

1. **Live Demo Poll as Homepage**
   - Replace static hero section with interactive, full-viewport poll card
   - Show curated "Poll of the Day" or featured active poll
   - Enable instant voting without authentication
   - Display real-time results after vote submission

2. **Discord-Inspired Design System**
   - Implement purple/blue color palette (#5865F2 primary)
   - Apply modern, playful aesthetic throughout
   - Add celebration animations (confetti, progress bars)
   - Create consistent component styling

3. **Conversion-Optimized UX Flow**
   - Voter → See Results → "Create Your Own" CTA pattern
   - Streamlined navigation (reduce from 3 CTAs to 2)
   - Mobile-first, thumb-friendly interaction design
   - Performance targets: <1.5s FCP on 3G

4. **Accessibility & Polish**
   - WCAG AA compliance (keyboard nav, screen readers, color contrast)
   - Smooth animations with `prefers-reduced-motion` support
   - Responsive breakpoints (mobile/tablet/desktop)
   - Error states and loading skeletons

**How it integrates:**
- Uses existing `PollViewer` component with enhanced styling
- Leverages current Supabase Realtime subscriptions
- Extends existing Tailwind configuration with new color tokens
- Maintains compatibility with existing poll creation flow
- No database schema changes required

**Success criteria:**
- [ ] Homepage loads in <1.5 seconds on mobile 3G
- [ ] Users can vote on demo poll within 10 seconds of landing
- [ ] 30%+ of voters proceed to "Create Your Own" (conversion goal)
- [ ] Real-time vote updates work across multiple sessions
- [ ] WCAG AA accessibility score of 95+ on Lighthouse
- [ ] Zero regressions in existing poll creation/viewing flows

## Stories

### Story 6.1: Live Demo Poll Component & Core Redesign
**Description:** Transform homepage to feature a full-viewport, interactive demo poll that users can vote on immediately. Replace static content with a working poll that demonstrates product value instantly.

**Key Tasks:**
- Update `page.tsx` to render full-screen poll card
- Implement demo poll data fetching (curated or featured poll)
- Enable anonymous voting on demo poll
- Add real-time vote count updates
- Create smooth transition from vote to results view
- Remove old hero section and features grid

**Acceptance Criteria:**
- Demo poll loads and displays within 1.5s on mobile
- Anonymous users can vote without login
- Vote submission provides immediate visual feedback
- Real-time vote counts update across multiple browser sessions
- Works on mobile, tablet, and desktop breakpoints

---

### Story 6.2: Discord-Inspired Design System & Animations
**Description:** Implement the Discord-inspired purple/blue design system across the homepage with celebration animations (confetti, progress bars) and modern UI polish.

**Key Tasks:**
- Add purple/blue color tokens to Tailwind config (#5865F2, etc.)
- Style poll card with new design system
- Implement confetti celebration animation on vote
- Create animated progress bars for results display
- Add hover/press states with transforms and shadows
- Ensure `prefers-reduced-motion` accessibility support

**Acceptance Criteria:**
- Primary purple (#5865F2) used for all CTAs and highlights
- Confetti animation triggers on vote submission (2s duration)
- Progress bars animate smoothly (800ms ease-out)
- Animations respect `prefers-reduced-motion` setting
- Hover/press states feel polished and responsive

---

### Story 6.3: Conversion CTA & Performance Optimization
**Description:** Implement the conversion funnel (Vote → Results → "Create Your Own" CTA) and optimize homepage performance to meet <1.5s FCP target on mobile 3G.

**Key Tasks:**
- Add "Create Your Own" CTA after vote results
- Simplify navigation (remove redundant CTAs)
- Implement code splitting and lazy loading
- Optimize images with WebP format and blur-up placeholders
- Add loading skeletons for perceived performance
- Run Lighthouse audits and fix performance issues

**Acceptance Criteria:**
- "Create Your Own" CTA prominently displayed after voting
- Secondary "Browse Polls" action available
- First Contentful Paint <1.5s on mobile 3G
- Lighthouse Performance score 90+
- Lighthouse Accessibility score 95+
- No layout shift (CLS score <0.1)

## Compatibility Requirements

- [x] Existing poll viewing/voting APIs remain unchanged
- [x] Database schema changes: None required
- [x] UI changes follow existing Tailwind/Shadcn patterns (extended)
- [x] Performance impact: Improved (fewer components, better loading)
- [x] Authentication: Maintains existing Supabase Auth (optional for voting)
- [x] Mobile compatibility: Enhanced mobile-first design
- [x] Browser compatibility: All modern browsers (Chrome, Safari, Firefox, Edge)

## Risk Mitigation

**Primary Risk:** Homepage redesign might confuse existing users who expect traditional landing page format

**Mitigation:**
- A/B test new homepage with subset of traffic (10% initially)
- Add subtle "What is ThisOrThat?" link for first-time visitors
- Implement feature flag to quickly rollback if conversion drops
- Monitor analytics for bounce rate and conversion metrics

**Rollback Plan:**
- Homepage is a single file replacement (`page.tsx`)
- Revert to previous version via git (`git revert <commit>`)
- Feature flag allows instant rollback without deployment
- Previous homepage saved as `page.backup.tsx` for quick restore
- Zero database changes means no data migration needed

**Secondary Risk:** Real-time voting performance degrades with high traffic

**Mitigation:**
- Use existing battle-tested Supabase Realtime infrastructure
- Implement client-side debouncing for vote updates (300ms)
- Add loading states and optimistic UI updates
- Monitor Supabase connection pool and scale if needed

**Tertiary Risk:** Confetti animation causes accessibility issues or performance problems

**Mitigation:**
- Respect `prefers-reduced-motion` setting (disable animations)
- Lazy load confetti library (15KB gzipped) only after vote
- Limit animation to 2 seconds with proper cleanup
- Test on older devices and adjust complexity if needed

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] Existing poll creation and viewing functionality verified (regression testing)
- [x] Integration with real-time voting system working correctly
- [x] Lighthouse scores meet targets (Performance 90+, Accessibility 95+)
- [x] Mobile-first responsive design tested on actual devices
- [x] Analytics events tracking vote and conversion actions
- [x] Documentation updated (README, component docs)
- [x] No regressions in existing features (full test suite passing)
- [x] Feature flag implemented for controlled rollout
- [x] UX spec and design files linked in stories

## References

- **UX Specification:** [Generated by Sally - UX Expert] (completed in this session)
- **Architecture:** `/docs/architecture.md` - Frontend Architecture section
- **Current Homepage:** `/apps/web/src/app/page.tsx`
- **Existing Poll Components:** `/apps/web/src/components/poll/`
- **Design Inspiration:** [Discord](https://discord.com/) - Purple/blue aesthetic

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-27 | 1.0 | Epic created from UX specification | John (PM) |

---

## Story Manager Handoff

**Context for Story Creation:**

This is an enhancement to an existing Next.js 14+ application with Tailwind CSS and Supabase backend. The homepage redesign focuses on replacing static content with an interactive demo poll to reduce decision paralysis (brand mission: "Stop Overthinking. Start Choosing").

**Integration points:**
- Homepage file: `apps/web/src/app/page.tsx`
- Poll components: `src/components/poll/PollViewer.tsx`, `PollCard.tsx`, `VoteButton.tsx`
- Real-time system: Supabase Realtime subscriptions (already implemented)
- API routes: `/api/polls` (existing, no changes needed)
- Styling: Tailwind CSS with new color tokens, Shadcn/ui components

**Existing patterns to follow:**
- React Server Components for initial data fetching
- Client Components (`'use client'`) for interactive elements
- Service layer pattern: `lib/services/polls.ts` for API calls
- Custom hooks: `usePoll.ts`, `useRealtimeVotes.ts`
- Error handling: Toast notifications with `sonner`
- Loading states: Skeleton components from Shadcn/ui

**Critical compatibility requirements:**
- No database schema changes (pure frontend redesign)
- Existing poll creation flow must continue working unchanged
- Real-time voting system integration (already exists, reuse it)
- Mobile-first responsive design (matches existing app pattern)
- Accessibility compliance (WCAG AA standard across app)

**Key constraints:**
- Performance budget: <1.5s FCP on mobile 3G
- Bundle size: New components should lazy load (code splitting)
- Animation performance: 60fps on modern devices, 30fps minimum
- Browser support: All modern browsers (no IE11)

Each story must include:
1. Clear acceptance criteria linking to UX spec sections
2. Testing requirements (unit, integration, E2E)
3. Performance validation steps
4. Accessibility verification checklist
5. Regression testing to ensure existing functionality intact

The epic maintains system integrity while delivering a conversion-optimized homepage that embodies the ThisOrThat brand promise.

