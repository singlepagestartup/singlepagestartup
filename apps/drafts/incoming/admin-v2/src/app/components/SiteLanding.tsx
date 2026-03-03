import { Link } from "react-router";
import {
  ArrowRight,
  Shield,
  ShoppingCart,
  FileText,
  BarChart3,
  Bell,
  MessageSquare,
  Bot,
  Layers,
  Lock,
  Globe,
  Zap,
  CheckCircle2,
  Star,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  Play,
  Users,
  TrendingUp,
  Database,
  Code,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

/* ─── Image URLs ─────────────────────────────────────────────────────────── */
const IMG_HERO =
  "https://images.unsplash.com/photo-1618410325698-018bb3eb2318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBsYXB0b3AlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzcxNzE1MzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_ABOUT =
  "https://images.unsplash.com/photo-1582005450386-52b25f82d9bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3RhcnR1cCUyMHRlYW0lMjBtZWV0aW5nfGVufDF8fHx8MTc3MTcxNTM2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_BLOG_1 =
  "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_BLOG_2 =
  "https://images.unsplash.com/photo-1718630732291-3bc8de36b030?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG91ZCUyMGluZnJhc3RydWN0dXJlJTIwc2VydmVyJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcxNzE1MzcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_BLOG_3 =
  "https://images.unsplash.com/photo-1692106979244-a2ac98253f6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjBzY3JlZW4lMjBkYXJrfGVufDF8fHx8MTc3MTcxNTM3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_AVATAR_1 =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_AVATAR_2 =
  "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcxNjEyNDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const IMG_AVATAR_3 =
  "https://images.unsplash.com/photo-1758599543154-76ec1c4257df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnRyZXByZW5ldXIlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MTcxNTM3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/* ─── Data ───────────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "#contact" },
];

const STATS = [
  { value: "15", label: "Modules", icon: Layers },
  { value: "50+", label: "Models", icon: Database },
  { value: "99.9%", label: "Uptime", icon: TrendingUp },
  { value: "24/7", label: "Support", icon: Users },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Website Builder",
    desc: "Build pages visually with widgets, sliders, buttons, and logotypes managed from the admin panel.",
  },
  {
    icon: ShoppingCart,
    title: "Ecommerce Engine",
    desc: "Full product catalog with attributes, categories, orders, and flexible store configurations.",
  },
  {
    icon: FileText,
    title: "Blog & Content",
    desc: "Rich-text articles with localized content, categories, and SEO-ready slug management.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Track metrics, build custom widgets, and monitor performance from a unified dashboard.",
  },
  {
    icon: MessageSquare,
    title: "Social & Messaging",
    desc: "Profiles, chats, threads, and actions — everything for community and social interactions.",
  },
  {
    icon: Bot,
    title: "AI Agents",
    desc: "Configure and manage AI-powered agents with custom widgets and behavior settings.",
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Templates, topics, and delivery channels for transactional and marketing notifications.",
  },
  {
    icon: Lock,
    title: "RBAC & Security",
    desc: "Roles, permissions, actions, and identity management for enterprise-grade access control.",
  },
];

const MODULES = [
  { icon: "🏗️", name: "Website Builder", models: 7 },
  { icon: "🛍️", name: "Ecommerce", models: 9 },
  { icon: "💳", name: "Billing", models: 4 },
  { icon: "📝", name: "Blog", models: 3 },
  { icon: "📋", name: "CRM", models: 6 },
  { icon: "💬", name: "Social", models: 8 },
  { icon: "🔔", name: "Notification", models: 4 },
  { icon: "🗂️", name: "File Storage", models: 2 },
  { icon: "🤖", name: "Agent", models: 2 },
  { icon: "📡", name: "Broadcast", models: 2 },
  { icon: "📈", name: "Analytic", models: 2 },
  { icon: "✈️", name: "Telegram", models: 2 },
  { icon: "🚀", name: "Startup", models: 1 },
  { icon: "🧩", name: "Host", models: 4 },
  { icon: "🔐", name: "RBAC", models: 6 },
];

const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "For personal projects and experimentation.",
    features: [
      "1 project",
      "3 modules",
      "Community support",
      "1 GB storage",
      "Basic analytics",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Startup",
    price: "$49",
    period: "/month",
    desc: "Everything a growing startup needs.",
    features: [
      "5 projects",
      "All 15 modules",
      "Priority support",
      "50 GB storage",
      "Advanced analytics",
      "Custom domain",
      "API access",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    desc: "For large teams and complex deployments.",
    features: [
      "Unlimited projects",
      "All 15 modules",
      "24/7 dedicated support",
      "500 GB storage",
      "Full analytics suite",
      "SSO & RBAC",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const BLOG_POSTS = [
  {
    img: IMG_BLOG_1,
    tag: "Analytics",
    title: "How to Build Data-Driven Dashboards",
    excerpt:
      "Learn how to leverage the Analytics module to create insightful dashboards and track key performance metrics.",
    date: "Feb 18, 2026",
    readTime: "5 min read",
  },
  {
    img: IMG_BLOG_2,
    tag: "Infrastructure",
    title: "Scaling Your Platform Architecture",
    excerpt:
      "Best practices for scaling from a single-page startup to enterprise-grade infrastructure with our Host module.",
    date: "Feb 12, 2026",
    readTime: "8 min read",
  },
  {
    img: IMG_BLOG_3,
    tag: "Development",
    title: "API Integration Step-by-Step",
    excerpt:
      "A comprehensive tutorial for integrating with our REST API and building custom workflows with webhooks.",
    date: "Feb 5, 2026",
    readTime: "12 min read",
  },
];

const TESTIMONIALS = [
  {
    avatar: IMG_AVATAR_1,
    name: "James Carter",
    role: "CTO, TechFlow",
    text: "The modular architecture saved us months of development. We shipped our MVP with ecommerce and blog fully integrated in just two weeks.",
    rating: 5,
  },
  {
    avatar: IMG_AVATAR_2,
    name: "Sarah Kim",
    role: "Product Lead, NovaBridge",
    text: "Having 15 modules out of the box means we focus on business logic, not infrastructure. The RBAC system alone replaced our custom auth layer.",
    rating: 5,
  },
  {
    avatar: IMG_AVATAR_3,
    name: "Marcus Webb",
    role: "Founder, LaunchPad.io",
    text: "The admin panel is incredibly intuitive. Our content team manages products, articles, and notifications without any developer involvement.",
    rating: 5,
  },
];

const INTEGRATIONS = [
  { icon: Code, label: "REST API" },
  { icon: Database, label: "PostgreSQL" },
  { icon: Zap, label: "Webhooks" },
  { icon: Globe, label: "CDN" },
  { icon: Lock, label: "OAuth 2.0" },
  { icon: Mail, label: "SMTP" },
];

const FOOTER_COLS = [
  {
    title: "Product",
    links: ["Features", "Modules", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Guides", "Blog", "Community"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Partners", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookies", "License", "Security"],
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export function SiteLanding() {
  return (
    <main className="flex-1">
      {/* ░░░ HERO ░░░ */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-600">
                v2.0 — Now with 15 modules
              </span>
            </div>
            <h1 className="text-4xl tracking-tight text-slate-900 lg:text-5xl">
              Domain Control Center
            </h1>
            <p className="mt-5 max-w-lg text-slate-600">
              A modular platform for building and managing your entire digital
              ecosystem — from ecommerce and blogs to AI agents and RBAC — all
              from a single admin panel.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-5 py-2.5 text-sm text-white shadow-sm transition hover:bg-slate-800"
              >
                Open Admin Panel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Play className="h-4 w-4" />
                Learn More
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-lg">
              <ImageWithFallback
                src={IMG_HERO}
                alt="Dashboard preview"
                className="h-auto w-full object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="text-sm text-slate-900">
                    All systems operational
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ░░░ STATS BAR ░░░ */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-slate-200 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 px-6 py-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                <stat.icon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <main>
        {/* ░░░ FEATURES ░░░ */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                Core Capabilities
              </p>
              <h2 className="text-3xl tracking-tight text-slate-900">
                Everything You Need, Modular by Design
              </h2>
              <p className="mt-3 text-slate-600">
                Each module works independently and connects seamlessly through
                a unified relation system.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 transition group-hover:border-slate-300 group-hover:bg-slate-100">
                    <f.icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="text-sm text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ░░░ ABOUT / IMAGE + TEXT ░░░ */}
        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ImageWithFallback
                src={IMG_ABOUT}
                alt="Team at work"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                About the Platform
              </p>
              <h2 className="text-3xl tracking-tight text-slate-900">
                Built for Builders
              </h2>
              <p className="mt-4 text-slate-600">
                We started with a simple idea: what if every common backend
                feature — ecommerce, CRM, blog, notifications, RBAC — was a
                pre-built module you could drop into any project?
              </p>
              <p className="mt-3 text-slate-600">
                The result is a platform with 15 composable modules, 50+ entity
                models, and a powerful admin panel that gives your team full
                control over every data point.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Modular architecture", icon: Layers },
                  { label: "Relation system", icon: Database },
                  { label: "Localized content", icon: Globe },
                  { label: "Rich-text editor", icon: FileText },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <item.icon className="h-4 w-4 text-slate-400" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ░░░ MODULES GRID ░░░ */}
        <section id="modules" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                Full Module List
              </p>
              <h2 className="text-3xl tracking-tight text-slate-900">
                15 Modules. One Ecosystem.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {MODULES.map((m) => (
                <div
                  key={m.name}
                  className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-4 py-5 text-center transition hover:border-slate-300 hover:shadow-sm"
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="mt-2 text-sm text-slate-900">{m.name}</span>
                  <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[10px] text-slate-500">
                    {m.models}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ░░░ INTEGRATIONS RIBBON ░░░ */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <p className="text-sm text-slate-500">
                Works with your existing stack:
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {INTEGRATIONS.map((i) => (
                  <div
                    key={i.label}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                  >
                    <i.icon className="h-4 w-4" />
                    {i.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ░░░ PRICING ░░░ */}
        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                Pricing
              </p>
              <h2 className="text-3xl tracking-tight text-slate-900">
                Simple, Transparent Plans
              </h2>
              <p className="mt-3 text-slate-600">
                Start free, scale when you're ready. No hidden fees.
              </p>
            </div>
            <div className="grid items-start gap-4 md:grid-cols-3">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border bg-white p-6 transition ${
                    plan.featured
                      ? "border-slate-400 shadow-lg ring-1 ring-slate-200"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {plan.featured && (
                    <span className="mb-4 inline-block rounded-full border border-slate-300 bg-slate-900 px-3 py-0.5 text-xs text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-sm text-slate-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-slate-500">
                      {plan.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{plan.desc}</p>
                  <button
                    className={`mt-6 w-full rounded-md border px-4 py-2.5 text-sm transition ${
                      plan.featured
                        ? "border-slate-400 bg-slate-900 text-white hover:bg-slate-800"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {plan.cta}
                  </button>
                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <ul className="space-y-2.5">
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ░░░ TESTIMONIALS ░░░ */}
        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                Testimonials
              </p>
              <h2 className="text-3xl tracking-tight text-slate-900">
                Trusted by Teams Worldwide
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-slate-200 bg-[#eaf0f7] p-6"
                >
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700">"{t.text}"</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
                    <ImageWithFallback
                      src={t.avatar}
                      alt={t.name}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-sm text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ░░░ BLOG ░░░ */}
        <section id="blog" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                  Latest Articles
                </p>
                <h2 className="text-3xl tracking-tight text-slate-900">
                  From the Blog
                </h2>
              </div>
              <Link
                to="/blog"
                className="hidden items-center gap-1 text-sm text-slate-600 transition hover:text-slate-900 md:inline-flex"
              >
                View all posts
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {BLOG_POSTS.map((post) => (
                <article
                  key={post.title}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <ImageWithFallback
                      src={post.img}
                      alt={post.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                        {post.tag}
                      </span>
                      <span className="text-xs text-slate-400">
                        {post.date}
                      </span>
                    </div>
                    <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-400">
                        {post.readTime}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 transition group-hover:text-slate-900">
                        Read more
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ░░░ CTA BANNER ░░░ */}
        <section className="border-y border-slate-200 bg-slate-900 py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl tracking-tight text-white">
              Ready to take control?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
              Explore the admin panel, manage your modules, and see how every
              entity connects through a unified relation system.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-white px-5 py-2.5 text-sm text-slate-900 transition hover:bg-slate-100"
              >
                Open Admin Panel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Explore Features
              </a>
            </div>
          </div>
        </section>

        {/* ░░░ CONTACT ░░░ */}
        <section id="contact" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
                  Get in Touch
                </p>
                <h2 className="text-3xl tracking-tight text-slate-900">
                  Contact Us
                </h2>
                <p className="mt-3 max-w-md text-slate-600">
                  Have questions about the platform? Want a demo? Reach out and
                  we'll get back to you within 24 hours.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { icon: Mail, label: "hello@sps.dev" },
                    { icon: Phone, label: "+1 (555) 123-4567" },
                    { icon: MapPin, label: "San Francisco, CA" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 text-sm text-slate-600"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
                        <item.icon className="h-4 w-4 text-slate-500" />
                      </div>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-slate-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        placeholder="John"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-slate-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        placeholder="Doe"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-700">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Acme Inc."
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-slate-700">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your project..."
                      className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    />
                  </div>
                  <button className="w-full rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ░░░ FOOTER ░░░ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <span className="text-sm">S</span>
                </div>
                <span className="text-sm text-slate-900">SPS</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Modular platform for building digital ecosystems.
              </p>
            </div>
            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-slate-600 transition hover:text-slate-900"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
            <p className="text-xs text-slate-400">
              &copy; 2026 SinglePageStartup. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-xs text-slate-400 transition hover:text-slate-600"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-xs text-slate-400 transition hover:text-slate-600"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-xs text-slate-400 transition hover:text-slate-600"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
