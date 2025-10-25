# ThisOrThat Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable college students to make quick decisions through simple, time-limited polls
- Create a mobile web-first polling platform that works seamlessly on any device
- Build a share-and-vote mechanism that connects friend groups for decision-making
- Establish foundation for future character system and gamification features
- Validate core user value proposition with minimal viable feature set

### Background Context

ThisOrThat addresses the modern epidemic of decision paralysis among college students who face overwhelming choices daily. Unlike traditional social media platforms designed for endless engagement, ThisOrThat focuses on utility - helping users make decisions quickly through simple binary polls shared with their friend groups. The platform leverages the psychological power of time pressure (24-hour poll limits) and social validation to create urgency and relevance without addiction.

The MVP targets college students as the primary user base, recognizing their need for quick decision-making tools for everything from outfit choices to dining decisions. By starting with a mobile web-first approach using Next.js and Supabase, we can rapidly validate the core concept while building a scalable foundation for future features like character interactions and predictive AI.

### Change Log

| Date       | Version | Description              | Author          |
| ---------- | ------- | ------------------------ | --------------- |
| 2025-01-27 | 1.0     | Initial MVP PRD creation | Product Manager |

## Requirements

### Functional Requirements

**FR1:** The system shall allow users to create polls by uploading two images and optionally adding labels and descriptions.

**FR2:** The system shall provide a binary voting interface where users can select between two options (Option A or Option B).

**FR3:** The system shall generate shareable links for each poll that can be accessed by anyone with the link.

**FR4:** The system shall automatically close polls after 24 hours from creation time.

**FR5:** The system shall display real-time vote counts that update immediately when votes are cast.

**FR6:** The system shall provide user authentication through OAuth providers (Google and Facebook).

**FR7:** The system shall be fully responsive and optimized for mobile web browsers.

**FR8:** The system shall allow anonymous voting without requiring authentication.

**FR9:** The system shall implement basic content moderation to prevent inappropriate image uploads.

### Non-Functional Requirements

**NFR1:** The system shall load poll pages within 2 seconds on mobile devices with 3G connection.

**NFR2:** The system shall support concurrent voting from multiple users without data inconsistency.

**NFR3:** The system shall maintain 99.9% uptime during peak usage hours.

**NFR4:** The system shall store and serve images efficiently with automatic optimization for mobile devices.

**NFR5:** The system shall handle image uploads up to 5MB per image with automatic compression.

**NFR6:** The system shall provide secure authentication with JWT tokens and proper session management.

**NFR7:** The system shall be accessible on all modern mobile browsers (Chrome, Safari, Firefox, Edge).

**NFR8:** The system shall scale to handle 1000+ concurrent users without performance degradation.

**NFR9:** The system shall provide real-time updates with latency under 500ms for vote submissions.

## User Interface Design Goals

### Overall UX Vision

ThisOrThat should feel like a fun, quick decision-making tool that college students can use effortlessly on their phones. The interface should be clean, modern, and focused on the core action - creating and voting on polls. The design should feel more like a utility app than a social media platform, emphasizing speed and simplicity over engagement metrics. The user journey from voter to creator should be seamless and friction-free.

### Key Interaction Paradigms

- **One-handed mobile usage** - All primary actions should be accessible with thumb navigation
- **Swipe-based interactions** - Natural mobile gestures for poll creation and voting
- **Instant feedback** - Real-time updates and immediate visual confirmation of actions
- **Minimal cognitive load** - Clear visual hierarchy with binary choices prominently displayed
- **Progressive disclosure** - Advanced features (descriptions, labels) are optional and don't clutter the main flow
- **Friction-free conversion** - Easy transition from voter to poll creator with clear call-to-action

### Core Screens and Views

- **Landing/Home Screen** - Simple poll creation entry point with recent polls and clear "Create Poll" CTA
- **Poll Creation Screen** - Two-image upload interface with large touch targets and optional labels/description
- **Poll Viewing/Voting Screen** - Large, touch-friendly voting interface with real-time results and visual countdown timer
- **Poll Results Screen** - Clear vote count display with sharing options and "Create Your Own" CTA
- **Authentication Screen** - OAuth login with Google/Facebook, positioned as optional for voting, required for creation

### Accessibility: WCAG AA

The platform should meet WCAG AA standards to ensure accessibility for all college students, including those with visual or motor impairments.

### Branding

Clean, modern aesthetic with a playful touch. Color scheme should be vibrant but not overwhelming, with high contrast for readability. Typography should be clear and legible on small screens. The overall feel should be approachable and fun without being childish.

### Target Device and Platforms: Web Responsive

Mobile web-first responsive design that works seamlessly across all devices, with particular optimization for mobile browsers. The interface should adapt gracefully from phone to tablet to desktop, but the primary experience is designed for mobile.

## Technical Assumptions

### Repository Structure: Monorepo

Single repository structure using npm workspaces to manage the Next.js application and shared packages. This approach simplifies development, deployment, and code sharing between frontend and backend components.

### Service Architecture

**Jamstack Architecture with Serverless Functions**

- Next.js 14+ with App Router for frontend and API routes
- Supabase for backend-as-a-service (database, authentication, real-time, storage)
- Vercel for hosting and serverless function deployment
- This architecture provides rapid development, automatic scaling, and zero DevOps overhead

### Testing Requirements

**Unit + Integration Testing**

- Frontend: Vitest + React Testing Library for component testing
- Backend: Vitest for API route testing
- E2E: Playwright for critical user flows (poll creation, voting, sharing)
- Focus on testing the core user journeys identified in the user journey mapping

### Additional Technical Assumptions and Requests

- **Image Optimization**: Next.js Image component with Supabase Storage for automatic optimization and CDN delivery
- **Real-time Updates**: Supabase Realtime for live vote counting and poll updates
- **Authentication**: Supabase Auth with Google/Facebook OAuth providers
- **Database**: PostgreSQL via Supabase with Row-Level Security for data protection
- **Mobile Performance**: Target < 2 second load times on 3G connections
- **File Upload**: Maximum 5MB per image with automatic compression
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Deployment**: Automatic deployment via Vercel with GitHub integration

## Epic List

### Epic 1: Foundation & Core Infrastructure

**Goal:** Establish project setup, authentication, and basic user management to enable poll creation and voting.

### Epic 2: Poll Creation & Management

**Goal:** Enable users to create polls with two images, optional labels/descriptions, and automatic 24-hour expiration.

### Epic 3: Voting System & Real-time Updates

**Goal:** Implement binary voting interface with real-time vote counting and results display.

### Epic 4: Sharing & Mobile Optimization

**Goal:** Enable shareable poll links and optimize the entire experience for mobile web browsers.

### Epic 5: Content Moderation & Safety

**Goal:** Implement basic content moderation and safety features to ensure appropriate use of the platform.

## Epic 1: Foundation & Core Infrastructure

**Expanded Goal:** Establish the foundational project infrastructure including Next.js application setup, Supabase integration, and user authentication system. This epic delivers the technical foundation and basic user management capabilities that enable all subsequent functionality. Users will be able to register, authenticate, and access the basic application structure.

### Story 1.1: Project Setup & Next.js Application

As a developer,
I want to set up the Next.js 14+ application with App Router and TypeScript,
so that I have a solid foundation for building the ThisOrThat platform.

**Acceptance Criteria:**

1. Next.js 14+ application is created with App Router configuration
2. TypeScript is configured with strict type checking
3. Tailwind CSS is installed and configured for styling
4. Basic project structure is established with proper folder organization
5. Development server runs successfully on localhost:3000
6. Basic layout component is created and renders correctly
7. Environment variables are configured for local development

### Story 1.2: Supabase Integration & Database Setup

As a developer,
I want to integrate Supabase and set up the database schema,
so that the application has a backend database for storing polls, votes, and user data.

**Acceptance Criteria:**

1. Supabase project is created and configured
2. Database schema is implemented with polls, votes, and users tables
3. Row-Level Security (RLS) policies are configured for data protection
4. Supabase client is configured in the Next.js application
5. Database connection is tested and working
6. Basic CRUD operations can be performed on the database
7. Environment variables for Supabase are properly configured

### Story 1.3: User Authentication System

As a user,
I want to authenticate using Google or Facebook OAuth,
so that I can create polls and manage my account securely.

**Acceptance Criteria:**

1. Supabase Auth is configured with Google and Facebook OAuth providers
2. Login page is created with OAuth provider buttons
3. Authentication flow works end-to-end (login, logout, session management)
4. Protected routes are implemented for authenticated users
5. User profile information is displayed after authentication
6. Session persistence works across browser refreshes
7. Error handling is implemented for authentication failures

### Story 1.4: Basic UI Components & Layout

As a user,
I want to see a clean, mobile-responsive interface,
so that I can navigate the application easily on my mobile device.

**Acceptance Criteria:**

1. Responsive layout component is created with mobile-first design
2. Navigation header is implemented with authentication status
3. Basic UI components (buttons, forms, cards) are created using Tailwind CSS
4. Mobile navigation is optimized for one-handed usage
5. Loading states and error states are implemented
6. Accessibility standards (WCAG AA) are met for basic components
7. Cross-browser compatibility is verified on mobile browsers

## Epic 2: Poll Creation & Management

**Expanded Goal:** Enable users to create polls by uploading two images with optional labels and descriptions. This epic delivers the core poll creation functionality that provides the primary user value proposition. Users will be able to create polls, set expiration times, and manage their poll content with a mobile-optimized interface.

### Story 2.1: Image Upload System

As a user,
I want to upload two images for my poll,
so that I can create visual comparisons for decision-making.

**Acceptance Criteria:**

1. Image upload interface is created with drag-and-drop and file picker options
2. Images are uploaded to Supabase Storage with proper organization
3. Image validation is implemented (file type, size limits up to 5MB)
4. Image compression and optimization is applied automatically
5. Upload progress indicators are displayed to users
6. Error handling is implemented for failed uploads
7. Images are displayed in preview before poll creation

### Story 2.2: Poll Creation Form

As a user,
I want to create a poll with two images and optional details,
so that I can share my decision dilemma with friends.

**Acceptance Criteria:**

1. Poll creation form is created with two image upload fields
2. Optional label fields are provided for each image option
3. Optional description field is available for poll context
4. Form validation is implemented for required fields
5. Mobile-optimized interface with large touch targets
6. Form submission creates poll record in database
7. Success confirmation and redirect to poll view page

### Story 2.3: Poll Expiration System

As a user,
I want my polls to automatically close after 24 hours,
so that decisions are made within a reasonable timeframe.

**Acceptance Criteria:**

1. Poll expiration is set to 24 hours from creation time
2. Automatic poll closure system is implemented
3. Poll status is tracked (active, closed, deleted)
4. Expired polls are marked as closed in the database
5. Visual indicators show poll expiration status
6. Countdown timer displays remaining time for active polls
7. Closed polls display final results and cannot accept new votes

### Story 2.4: Poll Management Interface

As a user,
I want to view and manage my created polls,
so that I can track their status and results.

**Acceptance Criteria:**

1. User dashboard displays all created polls
2. Poll status is clearly indicated (active, closed, expired)
3. Poll results are displayed with vote counts
4. Poll sharing options are available for each poll
5. Poll deletion functionality is implemented
6. Mobile-responsive layout for poll management
7. Real-time updates when poll status changes

## Epic 3: Voting System & Real-time Updates

**Expanded Goal:** Implement the core voting functionality with real-time updates that create engagement and differentiate from static polls. This epic delivers the interactive voting experience that enables users to participate in polls and see live results, creating the social engagement that drives platform adoption.

### Story 3.1: Poll Viewing Interface

As a user,
I want to view polls with clear voting options,
so that I can easily understand and participate in the decision-making process.

**Acceptance Criteria:**

1. Poll viewing page displays two images side by side
2. Option labels are clearly displayed with images
3. Poll description is shown when available
4. Voting buttons are large and touch-friendly for mobile
5. Poll expiration time is displayed with countdown timer
6. Poll status (active/closed) is clearly indicated
7. Mobile-responsive layout optimizes for one-handed usage

### Story 3.2: Binary Voting System

As a user,
I want to vote on polls by selecting one of two options,
so that I can participate in helping friends make decisions.

**Acceptance Criteria:**

1. Binary voting interface allows selection of Option A or Option B
2. Vote submission is processed and stored in database
3. Users can vote anonymously without authentication
4. Authenticated users can vote and have their vote tracked
5. Vote confirmation is displayed immediately after submission
6. Users cannot vote multiple times on the same poll
7. Error handling is implemented for failed vote submissions

### Story 3.3: Real-time Vote Counting

As a user,
I want to see vote counts update in real-time,
so that I can track the progress of polls I'm interested in.

**Acceptance Criteria:**

1. Real-time vote counting is implemented using Supabase Realtime
2. Vote counts update immediately when new votes are cast
3. Visual progress bars or charts display vote distribution
4. Total vote count is displayed prominently
5. Real-time updates work across multiple browser sessions
6. Connection status is indicated for real-time functionality
7. Fallback to polling updates if real-time connection fails

### Story 3.4: Poll Results Display

As a user,
I want to see clear poll results with vote counts,
so that I can understand the outcome of the decision-making process.

**Acceptance Criteria:**

1. Final poll results display vote counts for both options
2. Percentage breakdown is calculated and displayed
3. Visual representation (progress bars, charts) shows results clearly
4. Results are displayed for both active and closed polls
5. Mobile-optimized results view with clear typography
6. Results page includes sharing options for the poll
7. Historical results are preserved and accessible

## Epic 4: Sharing & Mobile Optimization

**Expanded Goal:** Enable viral growth through shareable poll links and ensure the entire experience is optimized for mobile web browsers. This epic delivers the sharing functionality that drives user acquisition and the mobile-first experience that ensures accessibility for college students on their phones.

### Story 4.1: Shareable Poll Links

As a user,
I want to share my polls with friends via links,
so that they can easily access and vote on my polls.

**Acceptance Criteria:**

1. Unique shareable links are generated for each poll
2. Links can be copied to clipboard with one tap
3. Native mobile sharing integration is implemented
4. Links work without requiring app installation
5. Shared links open directly to the poll voting page
6. Link sharing works across all major messaging platforms
7. Shareable links include poll preview information

### Story 4.2: Mobile Web Optimization

As a user,
I want the application to work seamlessly on my mobile browser,
so that I can use ThisOrThat easily on my phone.

**Acceptance Criteria:**

1. Mobile-first responsive design is implemented across all pages
2. Touch targets are optimized for finger navigation (minimum 44px)
3. One-handed usage is supported for all primary actions
4. Mobile browser compatibility is verified (Chrome, Safari, Firefox)
5. Performance is optimized for mobile networks (3G/4G)
6. Mobile-specific UI patterns are implemented (swipe gestures, etc.)
7. Mobile keyboard handling is optimized for form inputs

### Story 4.3: Progressive Web App Features

As a user,
I want ThisOrThat to feel like a native app on my phone,
so that I can access it quickly and easily.

**Acceptance Criteria:**

1. Web App Manifest is configured for mobile installation
2. Service Worker is implemented for offline functionality
3. App icons are created for mobile home screen installation
4. Splash screen is configured for app-like experience
5. Push notifications are implemented for poll updates
6. App-like navigation and transitions are implemented
7. Mobile-specific features (camera access) work properly

### Story 4.4: Cross-Platform Sharing Integration

As a user,
I want to share polls easily across different platforms,
so that I can reach my friends wherever they are.

**Acceptance Criteria:**

1. Social media sharing is implemented (Twitter, Facebook, Instagram)
2. Messaging app integration works (WhatsApp, iMessage, SMS)
3. Email sharing functionality is available
4. QR code generation for easy sharing is implemented
5. Share preview includes poll images and description
6. Sharing analytics track which platforms are most effective
7. Share buttons are prominently displayed and easy to use

## Epic 5: Content Moderation & Safety

**Expanded Goal:** Implement basic content moderation and safety features to ensure appropriate use of the platform by college students. This epic delivers essential safety measures that protect users and maintain a positive environment for decision-making, addressing the primary concern about inappropriate content and bullying.

### Story 5.1: Image Content Moderation

As a user,
I want inappropriate images to be filtered out,
so that the platform remains safe and appropriate for all users.

**Acceptance Criteria:**

1. Image content moderation system is implemented using AI/ML services
2. Inappropriate images are automatically flagged and blocked
3. Manual review process is available for flagged content
4. Users receive clear feedback when content is rejected
5. Appeal process is available for false positives
6. Content moderation works for both poll creation and profile images
7. Moderation system is configurable and can be updated

### Story 5.2: User Reporting System

As a user,
I want to report inappropriate content or behavior,
so that I can help maintain a safe community environment.

**Acceptance Criteria:**

1. Report functionality is available on all polls and user profiles
2. Multiple report categories are provided (inappropriate content, spam, harassment)
3. Report submission is anonymous and secure
4. Reported content is automatically flagged for review
5. Users receive confirmation when reports are submitted
6. Report history is tracked for repeat offenders
7. Reporting system is easily accessible on mobile devices

### Story 5.3: Community Guidelines & Enforcement

As a user,
I want clear guidelines about appropriate behavior,
so that I understand how to use the platform responsibly.

**Acceptance Criteria:**

1. Community guidelines are clearly displayed and accessible
2. Guidelines cover appropriate content, behavior, and usage
3. Guidelines are written in clear, student-friendly language
4. Enforcement actions are clearly explained (warnings, suspensions, bans)
5. Guidelines are prominently displayed during poll creation
6. Regular reminders about guidelines are shown to users
7. Guidelines are updated based on community feedback and incidents

### Story 5.4: User Blocking & Safety Features

As a user,
I want to block users who are causing problems,
so that I can control my experience on the platform.

**Acceptance Criteria:**

1. User blocking functionality is implemented
2. Blocked users cannot interact with the blocker's polls
3. Blocked users cannot see the blocker's profile or content
4. Block list is accessible and manageable in user settings
5. Blocking is immediate and effective across all platform features
6. Unblocking functionality is available with confirmation
7. Blocked user interactions are completely hidden from the blocker

## Next Steps

### UX Expert Prompt

Create a comprehensive UX architecture and design system for ThisOrThat MVP based on this PRD. Focus on mobile-first design patterns, user journey optimization, and accessibility standards. Deliver wireframes, component library, and interaction specifications.

### Architect Prompt

Design and implement the technical architecture for ThisOrThat MVP using Next.js 14+, Supabase, and Vercel. Create detailed system design, API specifications, database schema, and deployment strategy. Ensure scalability, security, and performance requirements are met.
