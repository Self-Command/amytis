import { buildSlugRegistry, getBacklinks } from '@/lib/content/discovery';
import { isFeatureEnabled } from '@/lib/features';
import { getAllFlows, getFlowBySlug, getAdjacentFlows } from '@/lib/content/flows';
import { siteConfig } from '../../../site.config';
import { notFound } from 'next/navigation';
import { getTranslator } from '@/lib/i18n';
import { getFlowUrl, localizeUrl } from '@/lib/urls';
import FlowCalendarSidebar from '@/components/FlowCalendarSidebar';
import Tag from '@/components/Tag';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Backlinks from '@/components/Backlinks';
import ShareBar from '@/components/ShareBar';
import Comments from '@/components/Comments';
import { resolveCommentable } from '@/lib/comments';
import Link from 'next/link';

interface FlowDetailBodyProps {
  locale: string;
  /** Flow date slug, "YYYY/MM/DD". */
  flowSlug: string;
}

/**
 * Shared body for a flow detail page (`/flows/YYYY/MM/DD` and locale-prefixed
 * variants). The caller handles param decoding and feature gating; this
 * component owns the lookup, sidebar/backlinks assembly, and prev/next nav.
 */
export default function FlowDetailBody({ locale, flowSlug }: FlowDetailBodyProps) {
  if (!isFeatureEnabled('flow')) notFound();
  const { t } = getTranslator(locale);

  const flow = getFlowBySlug(flowSlug, locale);
  if (!flow) notFound();

  const [year, month, day] = flow.slug.split('/');
  const allFlows = getAllFlows(locale);
  const entryDates = allFlows.map(f => f.date);
  const { prev, next } = getAdjacentFlows(flow.slug, locale);
  const slugRegistry = buildSlugRegistry(locale);
  const backlinks = getBacklinks(flow.slug, locale);
  const flowUrl = `${siteConfig.baseUrl}${localizeUrl(getFlowUrl(flow.slug), locale)}`;

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
      <Link href={localizeUrl('/flows', locale)} className="hover:text-accent no-underline shrink-0">
        {t('all_flows')}
      </Link>
      <span className="text-muted/40" aria-hidden="true">›</span>
      <Link href={localizeUrl(`/flows/${year}`, locale)} className="hover:text-accent no-underline shrink-0">
        {year}
      </Link>
      <span className="text-muted/40" aria-hidden="true">›</span>
      <Link href={localizeUrl(`/flows/${year}/${month}`, locale)} className="hover:text-accent no-underline shrink-0">
        {month}
      </Link>
      <span className="text-muted/40" aria-hidden="true">›</span>
      <span className="text-foreground shrink-0">{day}</span>
    </nav>
  );

  return (
    <div className="layout-main">
      <div className="flex gap-10">
        <FlowCalendarSidebar entryDates={entryDates} currentDate={flow.date} breadcrumb={breadcrumb} />

        <article className="flex-1 min-w-0">
          {/* Header */}
          <header className="mb-8">
            <time className="text-base font-mono text-accent" data-pagefind-meta="date[content]">{flow.date}</time>
            {flow.title !== flow.date && (
              <h1 className="mt-2 text-xl sm:text-2xl font-serif font-bold text-heading">{flow.title}</h1>
            )}
            {flow.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {flow.tags.map(tag => (
                  <Tag key={tag} tag={tag} variant="default" />
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MarkdownRenderer content={flow.content} slug={`flows/${year}/${month}/${day}`} slugRegistry={slugRegistry} />
          </div>

          <Backlinks backlinks={backlinks} locale={locale} />

          <ShareBar url={flowUrl} title={flow.title} className="mt-8 mb-2" />

          {resolveCommentable(flow.commentable, 'flows') && (
            <Comments slug={`flows/${flow.slug}`} postUrl={flowUrl} />
          )}

          {/* Prev/Next navigation */}
          <nav aria-label="Post navigation" className="mt-12 pt-12 border-t border-line grid grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={localizeUrl(getFlowUrl(prev.slug), locale)}
                className="group text-left no-underline"
              >
                <span className="text-xs text-muted">{t('older')}</span>
                <div className="text-sm font-mono text-heading group-hover:text-accent transition-colors">
                  {prev.date}
                </div>
                {prev.title !== prev.date && (
                  <div className="text-sm text-muted group-hover:text-accent/80 transition-colors truncate">
                    {prev.title}
                  </div>
                )}
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={localizeUrl(getFlowUrl(next.slug), locale)}
                className="group text-right no-underline"
              >
                <span className="text-xs text-muted">{t('newer')}</span>
                <div className="text-sm font-mono text-heading group-hover:text-accent transition-colors">
                  {next.date}
                </div>
                {next.title !== next.date && (
                  <div className="text-sm text-muted group-hover:text-accent/80 transition-colors truncate">
                    {next.title}
                  </div>
                )}
              </Link>
            ) : <div />}
          </nav>
        </article>
      </div>
    </div>
  );
}
