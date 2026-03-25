"use client";

import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Badge, Button } from "@/components/ui";
import { Download, Eye, Calendar } from "lucide-react";

const mockReports = [
  {
    id: "r1",
    period: "2026年3月",
    geoScore: 82,
    geoChange: +5,
    kwChecked: 50,
    topImprovement: "note運用代行 +12pt",
    generated: "2026-03-25",
  },
  {
    id: "r2",
    period: "2026年2月",
    geoScore: 77,
    geoChange: +3,
    kwChecked: 48,
    topImprovement: "AI検索 最適化 +8pt",
    generated: "2026-02-28",
  },
  {
    id: "r3",
    period: "2026年1月",
    geoScore: 74,
    geoChange: -2,
    kwChecked: 45,
    topImprovement: "ChatGPT SEO +15pt",
    generated: "2026-01-31",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="月次レポート"
        description="PDF自動生成・ダウンロード"
        actions={
          <Button size="sm">
            <Calendar size={14} />
            レポート生成
          </Button>
        }
      />

      <div className="space-y-4">
        {mockReports.map((report) => (
          <Card key={report.id} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-text-primary">
                    {report.period} レポート
                  </h3>
                  <Badge variant="success">生成済み</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase">GEOスコア</p>
                    <p className="text-lg font-bold font-mono">{report.geoScore}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase">前月比</p>
                    <p className={`text-lg font-bold font-mono ${report.geoChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {report.geoChange >= 0 ? "+" : ""}{report.geoChange}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase">監視KW数</p>
                    <p className="text-lg font-bold font-mono">{report.kwChecked}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase">TOP改善</p>
                    <p className="text-sm font-medium text-text-primary mt-0.5">{report.topImprovement}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline"><Eye size={14} /> プレビュー</Button>
                <Button size="sm"><Download size={14} /> PDF</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
