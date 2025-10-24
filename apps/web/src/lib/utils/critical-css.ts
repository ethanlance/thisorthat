/**
 * Critical CSS utilities for performance optimization
 * Extracts and inlines critical CSS for above-the-fold content
 */

export const criticalCSS = `
/* Critical CSS for above-the-fold content */
* {
  box-sizing: border-box;
}

html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: var(--color-foreground);
  background-color: var(--color-background);
}

/* Critical layout styles */
.min-h-screen {
  min-height: 100vh;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.w-full {
  width: 100%;
}

.h-16 {
  height: 4rem;
}

.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}

/* Critical header styles */
.sticky {
  position: sticky;
}

.top-0 {
  top: 0;
}

.z-50 {
  z-index: 50;
}

.border-b {
  border-bottom-width: 1px;
}

.bg-background\/95 {
  background-color: rgb(var(--color-background) / 0.95);
}

.backdrop-blur {
  backdrop-filter: blur(8px);
}

/* Critical button styles */
.inline-flex {
  display: inline-flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.rounded-md {
  border-radius: 0.375rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.font-medium {
  font-weight: 500;
}

.transition-colors {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Critical color variables */
:root {
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 271.78 0.213 0.557;
  --color-primary-dark: 271.72 0.196 0.465;
  --color-primary-light: 258.16 0.152 0.627;
  --color-muted: 210 40% 98%;
  --color-muted-foreground: 215.4 16.3% 46.9%;
  --color-border: 214.3 31.8% 91.4%;
  --color-ring: 222.2 84% 4.9%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: 222.2 84% 4.9%;
    --color-foreground: 210 40% 98%;
    --color-muted: 217.2 32.6% 17.5%;
    --color-muted-foreground: 215 20.2% 65.1%;
    --color-border: 217.2 32.6% 17.5%;
  }
}
`;

/**
 * Inline critical CSS in the document head
 * This should be called during server-side rendering
 */
export function getCriticalCSS(): string {
  return criticalCSS;
}

/**
 * Defer non-critical CSS loading
 * This should be used for CSS that's not needed for above-the-fold content
 */
export function deferCSS(href: string): string {
  return `
    <link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="${href}"></noscript>
  `;
}
