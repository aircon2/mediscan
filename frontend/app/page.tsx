import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-start justify-center bg-gradient-to-b from-blue-50 to-purple-50 font-sans px-9 pt-20 overflow-hidden">
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      
      <main className="flex flex-col items-start max-w-md w-full relative z-10">
        {/* Header Text */}
        <div className="flex flex-col items-start gap-4 text-left w-full">
          <h1
            className="text-2xl font-medium tracking-wider text-blue-600 leading-relaxed"
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontOpticalSizing: "auto",
              fontWeight: 500,
              fontStyle: "normal",
            }}
          >
            From ingredients to insight. See beyond the label.
          </h1>
        </div>

        {/* Pills Image */}
        <div className="relative w-64 h-64 my-8 self-center">
          <Image
            src="/pills.png"
            alt="Medicine pills illustration"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full self-center">
          <button
            className="w-full py-1 px-6 rounded-full bg-blue-50 text-blue-600 font-medium text-lg transition-all hover:scale-105"
            style={{
              boxShadow:
                "10px 10px 20px 0px rgba(13, 39, 80, 0.16), -10px -10px 20px 0px #FFFFFF",
            }}
          >
            Scan a medicine
          </button>

          <Link
            href="/search"
            className="w-full py-1 px-6 rounded-full bg-blue-50 text-blue-600 font-medium text-lg transition-all hover:scale-105 text-center block"
            style={{
              boxShadow:
                "10px 10px 20px 0px rgba(13, 39, 80, 0.16), -10px -10px 20px 0px #FFFFFF",
            }}
          >
            Search my symptoms
          </Link>

          <Link
            href="/graph"
            className="text-sm text-blue-600 font-medium text-lg text-center underline hover:text-blue-700 transition-colors mt-2"
          >
            Try a Demo Label
          </Link>
        </div>

        {/* Footer */}
        <p className="text-blue-500 text-sm mt-16 self-center">
          Educational tool. Not medical advice.
        </p>
      </main>
    </div>
  );
}
