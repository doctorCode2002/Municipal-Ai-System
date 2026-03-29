import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  end: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  step?: number;
};

export default function AnimatedCounter({
  end,
  suffix = "",
  decimals = 0,
  duration = 2000,
  delay = 2200,
  step,
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;
    const timeoutId = setTimeout(() => {
      const updateCounter = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);

        let currentValue = end * easeProgress;
        if (step) {
          currentValue = Math.round(currentValue / step) * step;
          if (currentValue > end) currentValue = end;
        }

        setValue(currentValue);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateCounter);
        } else {
          setValue(end);
        }
      };

      animationFrame = requestAnimationFrame(updateCounter);
    }, delay);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      clearTimeout(timeoutId);
    };
  }, [end, duration, delay, step]);

  return (
    <span>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
