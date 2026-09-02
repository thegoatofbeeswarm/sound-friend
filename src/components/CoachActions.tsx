import { ArrowRight, Brain, Ear, MessageCircleQuestion, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const COACH_PROMPTS = [
  { label: "Why is my right ear worse at 8 kHz?", icon: Ear },
  { label: "Did my hearing change from last month?", icon: ArrowRight },
  { label: "What does -15 dB mean?", icon: MessageCircleQuestion },
  { label: "Why am I struggling with speech in noise?", icon: Volume2 },
  { label: "Which training should I do today?", icon: Brain },
] as const;

export function CoachActions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ask Audiomaxxer</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {COACH_PROMPTS.map(({ label, icon: Icon }) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            className="h-auto min-h-11 justify-start whitespace-normal px-4 py-3 text-left text-sm"
            onClick={() => onSelect(label)}
          >
            <Icon className="shrink-0 text-signal" />
            <span>{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
