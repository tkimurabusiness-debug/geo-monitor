"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Check, Eye, EyeOff } from "lucide-react";
import type { Plan } from "@geo-monitor/shared-types";
import { createClient } from "@/lib/supabase/client";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const plans: Array<{
  id: Plan;
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}> = [
  {
    id: "basic",
    name: "ベーシック",
    price: "¥50,000/月",
    features: ["サイト1つ", "KW 100件", "競合3社", "週1チェック"],
  },
  {
    id: "pro",
    name: "プロ",
    price: "¥150,000/月",
    features: ["サイト3つ", "KW 500件", "競合10社", "週2チェック", "Slack通知", "月次PDF"],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "エンタープライズ",
    price: "¥500,000/月",
    features: ["サイト10", "KW 無制限", "競合無制限", "日次チェック", "専任サポート"],
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("pro");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (step === 1) {
      if (!companyName || !email || !password) {
        setError("すべての項目を入力してください");
        return;
      }
      if (password.length < 8) {
        setError("パスワードは8文字以上にしてください");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: register
    setLoading(true);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
      router.push("/onboarding");
      return;
    }

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: companyName } },
    });
    if (authError || !authData.user) {
      setError(authError?.message ?? "登録に失敗しました");
      setLoading(false);
      return;
    }

    // 2. Create organization
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: companyName, slug, plan: selectedPlan })
      .select()
      .single();
    if (orgError || !org) {
      setError("組織の作成に失敗しました");
      setLoading(false);
      return;
    }

    // 3. Create user profile linked to org
    await supabase.from("users").insert({
      id: authData.user.id,
      email,
      full_name: companyName,
      organization_id: org.id,
      role: "owner",
    });

    setLoading(false);
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-lg">
      <div className="text-center mb-6">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white text-xs font-bold mb-4">
          GEO
        </div>
        <h1 className="text-xl font-bold text-text-primary">アカウント作成</h1>
        <p className="text-sm text-text-muted mt-1">
          {step === 1 ? "基本情報を入力" : "プランを選択"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        <StepDot active={step >= 1} label="1" />
        <div className="flex-1 h-px bg-border" />
        <StepDot active={step >= 2} label="2" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <Input
              id="company"
              label="会社名・ブランド名"
              placeholder="株式会社Stock Value"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              id="email"
              label="メールアドレス"
              type="email"
              placeholder="you@company.co.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <Input
                id="password"
                label="パスワード（8文字以上）"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-text-muted hover:text-text-secondary cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                type="button"
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left transition-all cursor-pointer",
                  selectedPlan === plan.id
                    ? "border-accent bg-accent-light/50"
                    : "border-border hover:border-accent/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {plan.name}
                      </span>
                      {plan.recommended && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                          おすすめ
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                      {plan.price}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      selectedPlan === plan.id
                        ? "border-accent bg-accent"
                        : "border-border",
                    )}
                  >
                    {selectedPlan === plan.id && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-md bg-bg-muted px-2 py-0.5 text-xs text-text-secondary"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            ))}
            <p className="text-xs text-text-muted text-center mt-2">
              初月無料トライアル。いつでもプラン変更可能。
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-danger bg-danger-light rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {step === 2 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              戻る
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading
              ? "作成中..."
              : step === 1
                ? "次へ"
                : "アカウント作成"}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-text-muted">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          ログイン
        </Link>
      </div>
    </Card>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
        active
          ? "bg-accent text-white"
          : "bg-bg-muted text-text-muted",
      )}
    >
      {label}
    </div>
  );
}
