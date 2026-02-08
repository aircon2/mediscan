export default function Search() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 font-sans overflow-hidden">
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-pink-700 to-pink-700/0 rounded-full blur-3xl pointer-events-none"></div>
      
      <main className="flex flex-col items-center max-w-md w-full px-9 relative z-10">
        <h1 className="text-2xl font-medium text-blue-600">Search</h1>
      </main>
    </div>
  );
}
