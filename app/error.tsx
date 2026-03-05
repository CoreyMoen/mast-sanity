"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
