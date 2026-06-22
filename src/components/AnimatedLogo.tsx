import React from "react";
import { motion } from "motion/react";

interface AnimatedLogoProps {
  className?: string;
}

export default function AnimatedLogo({ className = "" }: AnimatedLogoProps) {
  return (
    <div 
      className={`relative w-[50px] h-[50px] rounded-full border border-[#fbbf24] flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-350 select-none ${className}`}
      style={{
        boxShadow: "0 0 12px rgba(251, 191, 36, 0.35)",
        background: "#0b1329",
      }}
    >
      {/* Glow Pulse Ambient Layer: Pulses every 3 seconds */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#fbbf24]"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.02, 0.15, 0.02],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Main Brand Logo Image Emblem */}
      <motion.img
        src="/logo.png"
        alt="IZYSL Logo"
        className="w-full h-full object-cover relative z-1"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1], // Elegant easeOutQuart
        }}
      />
    </div>
  );
}
