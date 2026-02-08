import Link from "next/link";

export default function BackButton() {
  return (
    <Link
      href="/"
      className="absolute top-6 left-6 z-50 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center cursor-pointer hover:scale-105 transition-all"
      style={{
        boxShadow:
          "10px 10px 10px 0px rgba(174, 174, 205, 0.2), -10px -10px 10px 0px rgba(255, 255, 255, 0.7)",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}
