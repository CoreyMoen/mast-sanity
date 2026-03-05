/**
 * BillingHistory — Displays a table of past invoices and payments.
 *
 * Fetches billing history from the /api/billing/invoices endpoint, which
 * uses the payment provider abstraction so it works with any provider.
 * Shows invoice date, description, amount, status, and a link to view
 * or download each invoice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "paid" | "unpaid" | "void" | "draft" | "open";
  invoiceUrl?: string;
  pdfUrl?: string;
}

interface BillingHistoryProps {
  /** Stripe (or other provider) customer ID — required to fetch invoices */
  customerId: string | undefined;
}

// ─── Status badge styles ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<Invoice["status"], string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-amber-100 text-amber-700",
  open: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-500",
  void: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<Invoice["status"], string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  open: "Open",
  draft: "Draft",
  void: "Void",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function BillingHistory({ customerId }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch billing history");
      }

      const data = await response.json();
      setInvoices(data.invoices ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load billing history",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ── No customer ID — user has never subscribed ───────────────────────────

  if (!customerId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Billing History
          </h2>
        </div>
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No billing history
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Invoices will appear here once you subscribe to a paid plan.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Billing History
          </h2>
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Billing History
          </h2>
        </div>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={fetchInvoices}
            className="ml-2 inline-flex items-center gap-1 font-semibold underline hover:no-underline"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state (customer exists but no invoices yet) ────────────────────

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Billing History
          </h2>
        </div>
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No invoices yet
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Your invoices will appear here after your first billing cycle.
          </p>
        </div>
      </div>
    );
  }

  // ── Invoice table ────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Billing History
          </h2>
        </div>
        <button
          onClick={fetchInvoices}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-500">
                Date
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-500">
                Description
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-500">
                Amount
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium text-gray-500">
                Status
              </th>
              <th className="whitespace-nowrap pb-3 font-medium text-gray-500">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="group">
                <td className="whitespace-nowrap py-3 pr-4 text-gray-900">
                  {invoice.date}
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {invoice.description}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 font-medium text-gray-900">
                  {invoice.amount}
                </td>
                <td className="whitespace-nowrap py-3 pr-4">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      STATUS_STYLES[invoice.status],
                    )}
                  >
                    {STATUS_LABELS[invoice.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3">
                  {invoice.invoiceUrl ? (
                    <a
                      href={invoice.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 transition-colors hover:text-indigo-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Invoice
                    </a>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
