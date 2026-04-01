"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cardVariants, iconVariants } from "@/lib/animation/variants";
import { heroContent } from "@/lib/constants/siteContent";

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const slogan = "Dots become lines";
  const chars = Array.from(slogan);

  const sloganContainer = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: shouldReduceMotion ? 0 : 0.25,
        staggerChildren: shouldReduceMotion ? 0 : 0.02,
      },
    },
  };

  const sloganChar = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 520, damping: 32, mass: 0.7 },
    },
  };

  return (
    <motion.div 
      className="w-full lg:w-[65%] bg-card rounded-[20px] flex flex-col items-start justify-between p-6 min-h-[250px] lg:min-h-0"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={0}
      whileHover="hover"
    >
      <motion.div
        variants={iconVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Image
          src="/svgs/Vector2.svg"
          alt="StoneFon"
          width={150}
          height={150}
          className="w-12 lg:w-auto self-end"
        />
      </motion.div>
      <div className="flex flex-col">
        <h1 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-[1]">{heroContent.line1}</h1>
        <h1 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-[1]">{heroContent.line2Prefix} <span className="italic font-light">{heroContent.line2Emphasis}</span>{heroContent.line2Suffix}</h1>
        <h1 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-[1]">{heroContent.line3}</h1>
        <motion.p
          className="mt-4 text-sm tracking-wide text-foreground/70"
          variants={sloganContainer}
        >
          {chars.map((ch, idx) => (
            <motion.span
              key={`${ch}-${idx}`}
              variants={sloganChar}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -3, transition: { type: "spring", stiffness: 700, damping: 24 } }
              }
              className="inline-block"
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
        </motion.p>
      </div>
    </motion.div>
  );
}
