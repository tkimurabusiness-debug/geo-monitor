"use client";

import { PageHeader } from "@/components/layout";
import { Card, CardTitle, Button, Input, Badge, Tabs, PlatformIcon } from "@/components/ui";
import { AI_PLATFORMS, PLATFORM_META, PLAN_LIMITS } from "@geo-monitor/shared-types";
import { useMockAuth } from "@/hooks/use-mock-auth";

export default function SettingsPage() {
  const { user, organization } = useMockAuth();
  const planLimits = PLAN_LIMITS[organization.plan];

  return (
    <div className="space-y-6">
      <PageHeader title="設定" />

      <Tabs
        tabs={[
          { id: "profile", label: "プロフィール" },
          { id: "organization", label: "組織" },
          { id: "billing", label: "プラン・課金" },
          { id: "ai", label: "AI設定" },
          { id: "notifications", label: "通知" },
        ]}
      >
        {(active) => (
          <>
            {active === "profile" && (
              <Card padding="md">
                <CardTitle>プロフィール</CardTitle>
                <div className="mt-4 max-w-md space-y-4">
                  <Input id="name" label="名前" defaultValue={user.full_name} />
                  <Input id="email" label="メールアドレス" defaultValue={user.email} type="email" />
                  <Button>保存</Button>
                </div>
              </Card>
            )}

            {active === "organization" && (
              <Card padding="md">
                <CardTitle>組織設定</CardTitle>
                <div className="mt-4 max-w-md space-y-4">
                  <Input id="org-name" label="組織名" defaultValue={organization.name} />
                  <Input id="org-slug" label="スラッグ" defaultValue={organization.slug} />
                  <div>
                    <p className="text-xs font-medium text-text-secondary mb-2">メンバー</p>
                    <div className="rounded-lg border border-border p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-primary">{user.full_name}</p>
                        <p className="text-xs text-text-muted">{user.email}</p>
                      </div>
                      <Badge variant="default">オーナー</Badge>
                    </div>
                  </div>
                  <Button variant="outline">メンバーを招待</Button>
                </div>
              </Card>
            )}

            {active === "billing" && (
              <div className="space-y-4">
                <Card padding="md">
                  <CardTitle>現在のプラン</CardTitle>
                  <div className="mt-4 flex items-center gap-3">
                    <Badge variant="default" className="text-base px-3 py-1">
                      {organization.plan === "basic" ? "ベーシック" : organization.plan === "pro" ? "プロ" : "エンタープライズ"}
                    </Badge>
                    <span className="text-lg font-bold font-mono">
                      ¥{organization.plan === "basic" ? "50,000" : organization.plan === "pro" ? "150,000" : "500,000"}/月
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <LimitItem label="サイト数" used={1} max={planLimits.sites} />
                    <LimitItem label="キーワード" used={10} max={planLimits.keywords} />
                    <LimitItem label="競合" used={3} max={planLimits.competitors} />
                    <div>
                      <p className="text-[10px] text-text-muted uppercase">チェック頻度</p>
                      <p className="text-sm font-medium mt-0.5">
                        {planLimits.checkFrequency === "weekly" ? "週1回" : planLimits.checkFrequency === "biweekly" ? "週2回" : "毎日"}
                      </p>
                    </div>
                  </div>
                  <Button className="mt-4" variant="outline">プランを変更</Button>
                </Card>
              </div>
            )}

            {active === "ai" && (
              <Card padding="md">
                <CardTitle>モニタリング対象AI</CardTitle>
                <p className="text-xs text-text-muted mt-1 mb-4">
                  不要なAIを無効にすると処理速度向上・コスト削減
                </p>
                <div className="space-y-2">
                  {AI_PLATFORMS.map((p) => (
                    <label
                      key={p}
                      className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-bg-hover transition-colors"
                    >
                      <PlatformIcon platform={p} size="md" showLabel />
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-border text-accent focus:ring-accent cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {active === "notifications" && (
              <Card padding="md">
                <CardTitle>通知設定</CardTitle>
                <div className="mt-4 space-y-4">
                  <NotifToggle label="言及消失アラート" description="自社の言及が前回→今回で消えた場合" defaultChecked />
                  <NotifToggle label="順位下落アラート" description="2位以上の順位下落があった場合" defaultChecked />
                  <NotifToggle label="新規競合ランクイン" description="新しい競合がランクインした場合" defaultChecked />
                  <NotifToggle label="週次チェック完了" description="定期チェック完了時の通知" defaultChecked />
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-medium text-text-secondary mb-2">通知チャネル</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded border-border text-accent focus:ring-accent cursor-pointer" />
                        <span className="text-sm text-text-primary">メール</span>
                        <Badge variant="muted">全プラン</Badge>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded border-border text-accent focus:ring-accent cursor-pointer" />
                        <span className="text-sm text-text-primary">Slack</span>
                        <Badge variant="info">プロ以上</Badge>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}

function LimitItem({ label, used, max }: { label: string; used: number; max: number }) {
  const isInfinity = max === Infinity;
  const pct = isInfinity ? 0 : (used / max) * 100;
  return (
    <div>
      <p className="text-[10px] text-text-muted uppercase">{label}</p>
      <p className="text-sm font-medium mt-0.5">
        <span className="font-mono">{used}</span>
        <span className="text-text-muted"> / {isInfinity ? "∞" : max}</span>
      </p>
      {!isInfinity && (
        <div className="mt-1 bg-bg-muted rounded-full h-1.5">
          <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function NotifToggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start justify-between cursor-pointer">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} className="mt-1 rounded border-border text-accent focus:ring-accent cursor-pointer" />
    </label>
  );
}
