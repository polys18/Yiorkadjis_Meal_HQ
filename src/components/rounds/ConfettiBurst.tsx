"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiBurst({ trigger }: { trigger: number }) {
  useEffect(() => {
    if (trigger === 0) return;
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.4 },
      colors: ["#C77D49", "#7B8754", "#D4A847", "#D08585", "#4A6B7C"],
      disableForReducedMotion: true,
    });
  }, [trigger]);
  return null;
}
