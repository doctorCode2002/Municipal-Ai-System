import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

type ScrubRevealProps = {
  children: ReactNode;
  className?: string;
  x?: number;
  y?: number;
  delay?: number;
};

export default function ScrubReveal({
  children,
  className,
  x = 0,
  y = 0,
  delay = 0,
}: ScrubRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const startOffset = 95 - delay * 50;
  const endOffset = 75 - delay * 50;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start ${startOffset}%`, `start ${endOffset}%`],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const yTransform = useTransform(scrollYProgress, [0, 1], [y, 0]);
  const xTransform = useTransform(scrollYProgress, [0, 1], [x, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y: yTransform, x: xTransform }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
