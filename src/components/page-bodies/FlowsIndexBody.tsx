import { getAllFlows, getFlowTags } from '@/lib/content/flows';
import { buildSlugRegistry } from '@/lib/content/discovery';
import { firstPage } from '@/lib/pagination';
import { toFlowIndexItems } from '@/lib/flow-stream';
import { localizeUrl } from '@/lib/urls';
import { notFound } from 'next/navigation';
import FlowIndexClient from '@/components/FlowIndexClient';
import FlowStream from '@/components/FlowStream';
import PageHeader from '@/components/PageHeader';
import { siteConfig } from '../../../site.config';

const PAGE_SIZE = siteConfig.pagination.flows;

interface FlowsIndexBodyProps {
  locale: string;
}

/** Shared body for the flows listing (`/flows` and locale-prefixed variants). */
export default function FlowsIndexBody({ locale }: FlowsIndexBodyProps) {
  const allFlows = getAllFlows(locale);
  const { items: flows, totalPages } = firstPage(allFlows, PAGE_SIZE);
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
            pagination={totalPages > 1 ? { currentPage: 1, totalPages, basePath } : undefined}
            locale={locale}
          />
        }
      />
    </div>
  );
}
