"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX: width }}
      className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-gold"
      aria-hidden="true"
    />
  );
}
