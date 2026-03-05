"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PostComposer } from "@/components/composer/post-composer";

export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500">
        <Link
          href="/dashboard/posts"
          className="hover:text-indigo-600 transition-colors"
        >
          Posts
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900 font-medium">New Post</span>
      </nav>

      {/* Page heading */}
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
        Create Post
      </h1>

      {/* Composer */}
      <PostComposer />
    </div>
  );
}
