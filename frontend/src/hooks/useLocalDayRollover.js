import { useEffect, useState } from "react";

export default function useLocalDayRollover() {
  const [currentDay, setCurrentDay] = useState(() => new Date());

  useEffect(() => {
    let timeoutId;

    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);

      timeoutId = window.setTimeout(() => {
        setCurrentDay(new Date());
        scheduleNextMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };

    scheduleNextMidnight();
    return () => window.clearTimeout(timeoutId);
  }, []);

  return currentDay;
}