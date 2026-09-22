import { getAllFlows, getFlowTags } from '@/lib/content/flows';
import { buildSlugRegistry } from '@/lib/content/discovery';
import { isFeatureEnabled } from '@/lib/features';
import { firstPage, paginate } from '@/lib/pagination';
import { toFlowIndexItems } from '@/lib/flow-stream';
import { siteConfig } from '../../../site.config';
import { notFound } from 'next/navigation';
import { localizeUrl } from '@/lib/urls';
import FlowIndexClient from '@/components/FlowIndexClient';
import FlowStream from '@/components/FlowStream';
import PageHeader from '@/components/PageHeader';

interface FlowsIndexBodyProps {
  locale: string;
  /** Page number (1-based). */
  page?: number;
}

const PAGE_SIZE = siteConfig.pagination.flows;

/**
 * Shared body for the flow index (`/flows` and locale-prefixed variants, with
 * optional pagination). Mirrors the unprefixed flows/page.tsx, evaluated
 * against the given locale tree.
 */
export default function FlowsIndexBody({ locale, page = 1 }: FlowsIndexBodyProps) {
  if (!isFeatureEnabled('flow')) notFound();

  const allFlows = getAllFlows(locale);
  const slice = page === 1 ? firstPage(allFlows, PAGE_SIZE) : paginate(allFlows, page, PAGE_SIZE);
  if (!slice) notFound();
  const { items: flows, totalPages } = slice;
  const slugRegistry = buildSlugRegistry(locale);

  const basePath = localizeUrl('/flows', locale);

  return (
    <div className="layout-main">
      <PageHeader
        titleKey="flow"
        subtitleKey="flow_subtitle"
        subtitleParams={{ count: allFlows.length }}
        className="mb-12"
      />
      <FlowIndexClient
        allFlows={toFlowIndexItems(allFlows)}
        entryDates={allFlows.map(f => f.date)}
        tags={getFlowTags(locale)}
        feed={
          <FlowStream
            flows={flows}
            slugRegistry={slugRegistry}
            locale={locale}
            pagination={totalPages > 1 ? { currentPage: page, totalPages, basePath } : undefined}
          />
        }
      />
    </div>
  );
}
