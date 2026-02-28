"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SignupModal } from "@/components/SignupModal";
import { MatchInput } from "@/components/MatchInput";
import Link from "next/link";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import { getAppHref } from "@/lib/app-url";

export default function AnalysePage() {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<{ home: string; away: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const searchParams = useSearchParams();
  const initialHome = searchParams.get("home") ?? "";
  const initialAway = searchParams.get("away") ?? "";

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    const loggedIn = stored === "1";
    setIsLoggedIn(loggedIn);
  }, []);

  const handleCloseModal = () => {
    setShowSignupModal(false);
    setPendingMatch(null);
  };
  const handleSignIn = () => {
    setShowSignupModal(false);
    setPendingMatch(null);
    if (typeof window !== "undefined") localStorage.setItem(AUTH_STORAGE_KEY, "1");
    setIsLoggedIn(true);
  };
  const handleRequireAuth = (teams?: { home: string; away: string }) => {
    setPendingMatch(teams ?? null);
    setShowSignupModal(true);
  };

  if (isLoggedIn) {
    const matchesHref = getAppHref("/matches");
    return (
      <main className="min-h-screen bg-app-gradient flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">You&apos;re signed in</h1>
          <p className="text-zinc-400 text-lg mb-6">Go to the app to analyze a match</p>
          <Link
            href={matchesHref}
            className="inline-flex px-6 py-3 rounded-xl font-semibold text-black bg-gradient-to-r from-[#00ffe8] to-[#00ddcc] hover:opacity-90 transition"
          >
            Open matches →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app-gradient flex flex-col items-center px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Match analysis</h1>
        <p className="text-zinc-400 text-lg mb-1">Choose the two teams to analyze with AI</p>
        <p className="text-[#00ffe8] text-xs sm:text-sm max-w-2xl mx-auto">
          Our AI is connected to football news and crosses millions of data points for each prediction. Sign up to run the analysis.
        </p>
      </div>
      <div className="w-full max-w-xl mx-auto">
        <MatchInput
          redirectTo="/app/analysis"
          initialHome={initialHome}
          initialAway={initialAway}
          requireAuth
          isLoggedIn={false}
          onRequireAuth={handleRequireAuth}
        />
      </div>
      <p className="text-center mt-6">
        <button
          type="button"
          onClick={() => handleRequireAuth()}
          className="text-teal-400 hover:text-teal-300 text-sm underline"
        >
          Don&apos;t have an account? Sign up
        </button>
      </p>
      <SignupModal open={showSignupModal} onClose={handleCloseModal} onSignIn={handleSignIn} pendingMatch={pendingMatch} />
    </main>
  );
}
