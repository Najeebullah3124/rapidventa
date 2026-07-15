import { useCountdown } from "@/hooks/useCountdown";
import { useLang } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetDate: Date;
  variant?: "pill" | "boxes";
  className?: string;
}

export function CountdownTimer({ targetDate, variant = "boxes", className }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isUrgent, isEnded } = useCountdown(targetDate);
  const { t } = useLang();

  const pad = (n: number) => String(n).padStart(2, "0");

  if (isEnded) {
    return (
      <span className={cn("text-xs font-semibold text-red-500 uppercase tracking-wide", className)}>
        Finalizado
      </span>
    );
  }

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 bg-white/85 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-gray-900",
          isUrgent && "rv-urgent",
          className
        )}
        aria-label="Tiempo restante"
      >
        {days > 0 && <><span>{days}d</span><span className="text-[oklch(0.72_0.14_72)]">:</span></>}
        <span>{pad(hours)}</span>
        <span className="text-[oklch(0.72_0.14_72)]">:</span>
        <span>{pad(minutes)}</span>
        <span className="text-[oklch(0.72_0.14_72)]">:</span>
        <span>{pad(seconds)}</span>
      </span>
    );
  }

  // Boxes variant
  const units = [
    { value: days, label: t("cd.days") },
    { value: hours, label: t("cd.hours") },
    { value: minutes, label: t("cd.min") },
    { value: seconds, label: t("cd.sec") },
  ];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {isUrgent && (
        <p className="text-xs text-[oklch(0.72_0.14_72)] font-semibold rv-urgent uppercase tracking-wider">
          {t("cd.urgent")}
        </p>
      )}
      <div className="flex items-center gap-1">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center bg-[oklch(0.25_0.12_265)] rounded px-1.5 sm:px-2 py-1 min-w-[2rem] sm:min-w-[2.5rem]">
              <span className="text-white font-bold text-base sm:text-lg leading-none tabular-nums">
                {pad(unit.value)}
              </span>
              <span className="text-[oklch(0.72_0.14_72)] text-[0.6rem] font-medium uppercase tracking-wide mt-0.5">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="text-[oklch(0.72_0.14_72)] font-bold text-lg -mt-3">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
