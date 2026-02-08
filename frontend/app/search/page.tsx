"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackButton from "../components/BackButton";
import { searchEffects } from "../../utils/api";

interface Effect {
  name: string;
  medicationsCausingIt: string[];
  medicationsTreatingIt: string[];
  description?: string;
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchEffects(searchQuery);
        setResults(response.effects || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  return (
    <div className="relative flex min-h-screen items-start justify-center bg-gradient-to-b from-blue-50 to-purple-50 font-sans overflow-hidden pt-20">
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-pink-700 to-pink-700/0 rounded-full blur-3xl pointer-events-none"></div>

      <BackButton />

      <main className="flex flex-col items-start max-w-md w-full px-9 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-2xl font-medium text-blue-600 mb-4"
        >
          What's bothering you?
        </motion.h1>

        <motion.input
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nausea"
          className="w-full px-6 py-4 rounded-full bg-blue-50 text-blue-600 outline-none placeholder:text-blue-400/60"
          style={{
            boxShadow:
              "10px 10px 10px 0px rgba(174, 174, 205, 0.2), -10px -10px 10px 0px rgba(255, 255, 255, 0.7)",
          }}
        />

        {/* Search Results */}
        {searchQuery && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col w-full mt-3 rounded-2xl bg-blue-50 px-6 py-4"
            style={{
              boxShadow:
                "10px 10px 10px 0px rgba(174, 174, 205, 0.2), -10px -10px 10px 0px rgba(255, 255, 255, 0.7)",
            }}
          >
            {results.map((effect, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              >
                <Link
                  href={`/newGraph?effect=${encodeURIComponent(effect.name)}`}
                  className="w-full py-3 border-b border-blue-300/40 last:border-b-0 cursor-pointer hover:bg-blue-100/30 transition-colors block"
                >
                <div className="text-blue-600 font-medium">{effect.name}</div>
                {effect.description && (
                  <div className="text-blue-500 text-sm mt-1">
                    {effect.description}
                  </div>
                )}
              </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {searchQuery && !loading && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full mt-3 px-6 py-4 text-blue-400 text-center"
          >
            No results found
          </motion.div>
        )}
      </main>
    </div>
  );
}
