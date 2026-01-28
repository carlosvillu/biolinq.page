import type { ReactElement } from "react";

export interface LegalPageLayoutProps {
  /** Sanitized HTML from marked + DOMPurify */
  html: string;
  /** Page title (e.g., "Terms of Service") */
  title: string;
}

/**
 * LegalPageLayout - Presentational component for legal pages
 *
 * Renders sanitized HTML content from Markdown with Neo-Brutal styling.
 * Uses Tailwind prose classes for typography and applies project design system.
 *
 * @example
 * ```tsx
 * <LegalPageLayout
 *   title="Terms of Service"
 *   html="<h2>Introduction</h2><p>Welcome to our service...</p>"
 * />
 * ```
 */
export function LegalPageLayout({
  html,
  title,
}: LegalPageLayoutProps): ReactElement {
  return (
    <div className="min-h-screen bg-neo-input/30">
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Page Title */}
        <h1 className="mb-8 text-3xl font-bold text-neo-dark md:text-4xl">
          {title}
        </h1>

        {/* Neo-Brutal Card Container */}
        <div className="relative">
          {/* Shadow Layer */}
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-neo-dark" />

          {/* Content Card */}
          <article className="relative z-10 rounded-xl border-[3px] border-neo-dark bg-neo-panel p-6 md:p-8">
            {/* Sanitized HTML Content with Tailwind Prose */}
            <div
              className="prose prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-neo-dark prose-p:leading-relaxed prose-p:text-gray-700 prose-a:font-medium prose-a:text-neo-primary prose-a:underline prose-strong:font-bold prose-strong:text-neo-dark prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:marker:text-neo-dark max-w-none"
              // Safe because html comes from DOMPurify.sanitize() in legal-content.server.ts
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>
        </div>
      </main>
    </div>
  );
}
