"use client";

import { useState } from "react";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative flex min-h-screen items-start justify-center bg-gradient-to-b from-blue-50 to-purple-50 font-sans overflow-hidden pt-20">
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-pink-700 to-pink-700/0 rounded-full blur-3xl pointer-events-none"></div>

      <main className="flex flex-col items-start max-w-md w-full px-9 relative z-10">
        <h1 className="text-2xl font-medium text-blue-600 mb-4">
          What's bothering you?
        </h1>

        <input
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
        {searchQuery && (
          <div className="flex flex-col gap-3 w-full mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-full px-6 py-3 rounded-2xl bg-blue-50 text-blue-600"
                style={{
                  boxShadow:
                    "10px 10px 10px 0px rgba(174, 174, 205, 0.2), -10px -10px 10px 0px rgba(255, 255, 255, 0.7)",
                }}
              >
                {searchQuery}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
