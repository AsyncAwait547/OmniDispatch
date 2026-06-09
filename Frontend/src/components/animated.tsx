import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, type MotionValue } from "framer-motion";

export function WordsPullUp({
  text,
  className = "",
  showStatusBadge = false,
}: {
  text: string;
  className?: string;
  showStatusBadge?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const words = text.split(" ");
  return (
    <div ref={ref} className={`relative inline-flex flex-wrap ${className}`}>
      {showStatusBadge && (
        <span
          className="absolute top-[0.15em] left-[0.05em] text-signal font-mono tracking-widest animate-pulse"
          style={{ fontSize: "0.06em" }}
        >
          SYS:ONLINE
        </span>
      )}
      {words.map((w, i) => (
        <span key={i} className="overflow-hidden inline-flex">
          <motion.span
            className="inline-block"
            initial={{ y: 20, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

export function WordsPullUpMultiStyle({
  segments,
  className = "",
}: {
  segments: { text: string; className?: string }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const items = segments.flatMap((seg) =>
    seg.text.split(" ").map((word) => ({ word, className: seg.className ?? "" })),
  );
  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {items.map((it, i) => (
        <span key={i} className="overflow-hidden inline-flex">
          <motion.span
            className={`inline-block ${it.className}`}
            initial={{ y: 20, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {it.word}
            {i < items.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

function Letter({
  char,
  progress,
  index,
  total,
}: {
  char: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const charProgress = index / total;
  const opacity = useTransform(progress, [charProgress - 0.1, charProgress + 0.05], [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {char}
    </motion.span>
  );
}

export function AnimatedParagraph({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });
  const chars = text.split("");
  return (
    <p ref={ref} className={className}>
      {chars.map((c, i) => (
        <Letter key={i} char={c} progress={scrollYProgress} index={i} total={chars.length} />
      ))}
    </p>
  );
}
