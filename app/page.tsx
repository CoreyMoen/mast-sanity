import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Share2,
  BarChart3,
  Users,
  ImageIcon,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Visual calendar with drag-and-drop. Schedule posts across all platforms from one view.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Captions",
    description:
      "Generate engaging captions, hashtags, and rewrites with AI. Adjust tone for any audience.",
  },
  {
    icon: Share2,
    title: "Cross-Platform Publishing",
    description:
      "Publish to Instagram, Facebook, X, and LinkedIn simultaneously. Platform-specific previews included.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track engagement, reach, and growth. Find your best posting times with data-driven insights.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite your team with role-based permissions. Approval workflows keep your brand on-message.",
  },
  {
    icon: ImageIcon,
    title: "Media Library",
    description:
      "Upload, organize, and tag your assets. Quick-insert media into any post.",
  },
];

const platforms = [
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: Facebook },
  { name: "X / Twitter", icon: Twitter },
  { name: "LinkedIn", icon: Linkedin },
];

type PricingFeature = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
};

const pricingFeatures: PricingFeature[] = [
  { label: "Connected accounts", free: "1", pro: "10", business: "25" },
  {
    label: "Scheduled posts / mo",
    free: "10",
    pro: "Unlimited",
    business: "Unlimited",
  },
  { label: "Team members", free: "1", pro: "3", business: "15" },
  {
    label: "AI captions / mo",
    free: "10",
    pro: "100",
    business: "Unlimited",
  },
  {
    label: "Analytics retention",
    free: "7 days",
    pro: "90 days",
    business: "1 year",
  },
  { label: "Approval workflows", free: false, pro: true, business: true },
  { label: "Recurring posts", free: false, pro: true, business: true },
  { label: "Priority support", free: false, pro: false, business: true },
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    cta: "Start Free",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    cta: "Upgrade to Pro",
    href: "/sign-up?plan=pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "/mo",
    cta: "Contact Sales",
    href: "/sign-up?plan=business",
    highlight: false,
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-0.5 text-green-600">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-gray-100 p-0.5 text-gray-400">
        <X className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    );
  }
  return <span className="text-sm font-medium text-gray-900">{value}</span>;
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ------------------------------------------------------------------ */}
      {/*  Navbar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-indigo-600">
            Angela
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="transition-colors hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-gray-900">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/*  Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="hero-gradient">
        <div className="mx-auto max-w-4xl px-6 py-28 text-center sm:py-36">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            AI-powered social media scheduling
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Schedule Smarter.{" "}
            <span className="hero-headline-gradient">Post Everywhere.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            Angela is the AI-powered social media scheduler that helps you plan,
            create, and publish content across Instagram, Facebook, X, and
            LinkedIn&nbsp;&mdash; all from one dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Platform Logos Bar                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 px-6 py-8 sm:gap-14">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-2.5 text-gray-500"
            >
              <platform.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{platform.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Features                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to own social media
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              From scheduling to analytics, Angela gives your team the tools to
              create, publish, and grow&nbsp;&mdash; without the chaos.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Pricing                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="scroll-mt-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Start for free. Upgrade when you&rsquo;re ready.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
            {tiers.map((tier) => {
              const tierKey =
                tier.name.toLowerCase() as keyof PricingFeature;

              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-2xl bg-white p-8 ${
                    tier.highlight
                      ? "pricing-highlight"
                      : "border border-gray-200 shadow-sm"
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tier.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                        {tier.price}
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        {tier.period}
                      </span>
                    </div>
                  </div>

                  <ul className="mb-8 flex flex-1 flex-col gap-3.5">
                    {pricingFeatures.map((feature) => {
                      const value = feature[tierKey];
                      return (
                        <li
                          key={feature.label}
                          className="flex items-center justify-between gap-3 text-sm text-gray-600"
                        >
                          <span>{feature.label}</span>
                          <FeatureValue value={value} />
                        </li>
                      );
                    })}
                  </ul>

                  <Link
                    href={tier.href}
                    className={`block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors ${
                      tier.highlight
                        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  CTA Banner                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to level up your social game?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            Join thousands of marketers and creators who save hours every week
            with Angela.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Footer                                                             */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <a href="#features" className="transition-colors hover:text-gray-900">
              Product
            </a>
            <a href="#pricing" className="transition-colors hover:text-gray-900">
              Pricing
            </a>
            <Link href="/about" className="transition-colors hover:text-gray-900">
              About
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-gray-900">
              Terms
            </Link>
          </div>
          <p className="text-sm text-gray-400">
            &copy; 2026 Angela. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
