import { PLATFORM_META } from "@geo-monitor/shared-types";
import type { AIPlatform } from "@geo-monitor/shared-types";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platform: AIPlatform;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-5 w-5 text-[8px]",
  md: "h-6 w-6 text-[9px]",
  lg: "h-8 w-8 text-[10px]",
};

/** Compact AI platform icon with initials and brand color */
export function PlatformIcon({
  platform,
  size = "md",
  showLabel = false,
  className,
}: PlatformIconProps) {
  const meta = PLATFORM_META[platform];

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-md font-bold text-white shrink-0",
          sizeMap[size],
        )}
        style={{ backgroundColor: meta.color }}
        title={meta.label}
      >
        {meta.shortLabel}
      </div>
      {showLabel && (
        <span className="text-xs text-text-secondary">{meta.label}</span>
      )}
    </div>
  );
}

/** Row of platform icons */
export function PlatformIconRow({
  platforms,
  size = "sm",
}: {
  platforms: AIPlatform[];
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-center gap-1">
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} size={size} />
      ))}
    </div>
  );
}
