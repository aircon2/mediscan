import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className=" flex min-h-screen items-start justify-center bg-gradient-to-b from-blue-50 to-purple-50 font-sans px-6 pt-12 ">
      <main className="flex flex-col items-start gap-8 py-12 max-w-md w-full">
        {/* Header Text */}
        <div className="flex flex-col items-start gap-4 text-left w-full">
          <h1 className="text-2xl font-medium tracking-wider text-blue-600 leading-relaxed">
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
          <button className="w-full py-4 px-6 rounded-full bg-white text-blue-600 font-medium text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
            Scan a Medicine
          </button>

          <button className="w-full py-4 px-6 rounded-full bg-white text-blue-600 font-medium text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
            Search my symptoms
          </button>

          <Link
            href="/graph"
            className="w-full py-4 px-6 rounded-full border-2 border-blue-600 text-blue-600 font-medium text-lg text-center hover:bg-blue-50 transition-all"
          >
            Try a Demo Label
          </Link>
        </div>

        {/* Footer */}
        <p className="text-blue-500 text-sm mt-4 self-center">
          Educational tool. Not medical advice.
        </p>
      </main>
    </div>
  );
}
