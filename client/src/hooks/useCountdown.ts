import { useState, useEffect } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isEnded: boolean;
}

export function useCountdown(targetDate: Date): CountdownResult {
  const calculate = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false, isEnded: true };
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const isUrgent = diff < 5 * 60000; // < 5 minutes
    return { days, hours, minutes, seconds, isUrgent, isEnded: false };
  };

  const [state, setState] = useState(calculate);

  useEffect(() => {
    const interval = setInterval(() => setState(calculate()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return state;
}
