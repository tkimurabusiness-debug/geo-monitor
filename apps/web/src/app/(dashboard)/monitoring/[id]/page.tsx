"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, PlatformIcon } from "@/components/ui";
import { ArrowLeft, ExternalLink, Quote } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { mockAIResponse } from "@/lib/mock-data/monitoring";

export default function MonitoringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const data = mockAIResponse; // In real app, fetch by id

  // Highlight brand name in response
  const highlightedText = data.responseText.replace(
    /Stock Value/g,
    '<mark class="bg-accent-light text-accent-text px-0.5 rounded font-semibold">Stock Value</mark>',
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/monitoring"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent mb-3"
        >
          <ArrowLeft size={12} />
          モニタリング一覧に戻る
        </Link>
        <PageHeader
          title={`AI回答詳細`}
          description={`KW: ${data.keyword} | ${formatDate(data.checkedAt)}`}
        />
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-text-muted mb-2">プラットフォーム</p>
          <PlatformIcon platform={data.platform} size="lg" showLabel />
        </Card>
        <Card>
          <p className="text-xs text-text-muted">モデル</p>
          <p className="text-sm font-semibold mt-1">{data.model}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">自社言及</p>
          <div className="mt-1">
            {data.brandMentioned ? (
              <Badge variant="success">{data.brandRank}位で言及</Badge>
            ) : (
              <Badge variant="danger">言及なし</Badge>
            )}
          </div>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">競合言及数</p>
          <p className="text-sm font-semibold mt-1">
            {data.competitorsMentioned.length}社
          </p>
        </Card>
      </div>

      {/* AI Response Full Text */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-4">
          <Quote size={16} className="text-text-muted" />
          <CardTitle>AI回答テキスト</CardTitle>
        </div>
        <div
          className="prose prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: highlightedText }}
        />
      </Card>

      {/* Cited URLs */}
      {data.citedUrls.length > 0 && (
        <Card padding="md">
          <CardTitle>引用URL</CardTitle>
          <div className="mt-3 space-y-2">
            {data.citedUrls.map((url, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border-light p-3"
              >
                <ExternalLink size={14} className="text-accent shrink-0" />
                <span className="text-sm text-accent truncate">{url}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Competitors mentioned */}
      <Card padding="md">
        <CardTitle>言及された競合</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.competitorsMentioned.map((name, i) => (
            <Badge key={i} variant="muted">
              {name}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
