import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <FileQuestion className="h-16 w-16 text-gray-300" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
