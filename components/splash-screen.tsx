"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020b1a]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(37,99,235,0.18),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_30%_30%,rgba(109,40,217,0.12),transparent_60%)]" />

          <motion.div
            className="relative flex flex-col items-center"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="relative h-[64px] w-[64px] overflow-hidden rounded-[18px] border border-blue-400/45 bg-[linear-gradient(180deg,#091b34,#0b214a)]"
              animate={{
                boxShadow: [
                  "0 0 30px rgba(37,99,235,0.35)",
                  "0 0 80px rgba(37,99,235,0.7)",
                  "0 0 30px rgba(37,99,235,0.35)",
                ],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-[5px] rounded-[12px] border border-white/10 bg-[linear-gradient(180deg,#07101e,#0c1730)]" />
              <div className="absolute left-[12px] top-[12px] h-[34px] w-[8px] -skew-x-[20deg] rounded-full bg-white" />
              <div className="absolute left-[26px] top-[12px] h-[34px] w-[8px] -skew-x-[20deg] rounded-full bg-white" />
              <div className="absolute left-[40px] top-[16px] h-[28px] w-[10px] -skew-x-[20deg] rounded-full bg-[#2da8ff]" />
              <div className="absolute left-[28px] top-[36px] h-[14px] w-[8px] -skew-x-[20deg] rounded-full bg-[#2da8ff]" />
            </motion.div>

            <motion.div
              className="display-font mt-5 text-[2rem] font-semibold tracking-tight text-white"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              TradeLock
            </motion.div>

            <motion.div
              className="mt-2 text-[11px] font-medium tracking-[0.3em] text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              INITIALIZING ESCROW NETWORK
            </motion.div>

            <div className="mt-6 h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
