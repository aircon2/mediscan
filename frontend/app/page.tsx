"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 font-sans  pt-5 overflow-hidden">
        <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl font-semibold tracking-wide text-blue-600 text-center"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 600,
            }}
          >
            MediScan
          </motion.p>
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>

      <main className="flex flex-col items-start max-w-md w-full relative z-10 px-9">
          
        {/* Header Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-start gap-4 pt-15 text-left w-full"
        >
          <h1
            className="text-2xl font-medium tracking-wider text-blue-600 leading-snug px-5 text-center"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontOpticalSizing: "auto",
              fontWeight: 500,
              fontStyle: "normal",
            }}
          >
            From ingredients to insight. See beyond the label.
          </h1>
        </motion.div>

        {/* Pills Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="relative w-64 h-64 my-8 self-center"
        >
          <Image
            src="/pills.png"
            alt="Medicine pills illustration"
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-4 w-full self-center"
        >
          <button
            className="w-full py-2 px-6 rounded-full bg-blue-50 text-blue-600 font-medium text-lg transition-all hover:scale-105 "
            style={{
              boxShadow:
                "10px 10px 10px 0px rgba(174, 174, 205, 0.2), -10px -10px 10px 0px rgba(255, 255, 255, 0.7)",
            }}
          >
            Scan a medicine
          </button>

          <Link
            href="/search"
            className="w-full py-2 px-6 rounded-full bg-blue-50 text-blue-600 font-medium text-lg transition-all hover:scale-105 text-center block"
            style={{
              boxShadow:
                "10px 10px 10px 0px rgba(174, 174, 205, 0.2), -10px -10px 10px 0px rgba(255, 255, 255, 0.7)",
            }}
          >
            Search my symptoms
          </Link>

        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          className="text-blue-500 text-sm mt-25 self-center"
        >
          Educational tool. Not medical advice.
        </motion.p>
      </main>
    </div>
  );
}
