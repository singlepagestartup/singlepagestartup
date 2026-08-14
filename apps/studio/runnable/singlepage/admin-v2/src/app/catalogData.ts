/* ─── Catalog mock data for the public site (services) ─────────────────── */

import {
  Globe,
  MessageSquare,
  Layers,
  Smartphone,
  Palette,
  TrendingUp,
  Code,
  Cloud,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────────────── */

export interface CatalogCategory {
  slug: string;
  label: string;
}

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceTestimonial {
  name: string;
  role: string;
  avatar: string;
  text: string;
}

export interface ServiceProcess {
  step: number;
  title: string;
  desc: string;
}

export interface ServiceFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface ServiceStat {
  value: string;
  label: string;
}

export interface ServiceProduct {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  priceLabel: string;
  badge?: string;
  image: string;
  shortDescription: string;
  /* ── WPBakery-style page widgets data ── */
  heroDescription: string;
  features: ServiceFeature[];
  process: ServiceProcess[];
  stats: ServiceStat[];
  faq: ServiceFaq[];
  testimonials: ServiceTestimonial[];
  deliverables: string[];
  techStack: string[];
  relatedSlugs: string[];
  galleryImages: string[];
  ctaTitle: string;
  ctaDescription: string;
}

/* ── Images ──────────────────────────────────────────────────────────── */

const IMG = {
  web: "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  consulting:
    "https://images.unsplash.com/photo-1551135049-8a33b5883817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbnN1bHRpbmclMjBtZWV0aW5nJTIwb2ZmaWNlfGVufDF8fHx8MTc3MTcxNjY1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  saas: "https://images.unsplash.com/photo-1575388902449-6bca946ad549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTYWFTJTIwc29mdHdhcmUlMjBkYXNoYm9hcmQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzcxNzE2NjUxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  mobile:
    "https://images.unsplash.com/photo-1730818876578-4f5ed7376b28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBzbWFydHBob25lJTIwc2NyZWVufGVufDF8fHx8MTc3MTY5MzQwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  ux: "https://images.unsplash.com/photo-1761122827167-159d1d272313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVWCUyMGRlc2lnbiUyMHdpcmVmcmFtZSUyMHNrZXRjaHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  seo: "https://images.unsplash.com/photo-1632055186471-64814edeaab4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTRU8lMjBhbmFseXRpY3MlMjBncm93dGglMjBjaGFydHxlbnwxfHx8fDE3NzE2NTYyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  api: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBUEklMjBpbnRlZ3JhdGlvbiUyMGNvZGUlMjB0ZXJtaW5hbHxlbnwxfHx8fDE3NzE3MTY2NTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  cloud:
    "https://images.unsplash.com/photo-1506399558188-acca6f8cbf41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG91ZCUyMGNvbXB1dGluZyUyMHNlcnZlciUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3MTY4NTQxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  audit:
    "https://images.unsplash.com/photo-1740908900906-a51032597559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobmljYWwlMjBhdWRpdCUyMHNlY3VyaXR5JTIwcmV2aWV3fGVufDF8fHx8MTc3MTcxNjY1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  workshop:
    "https://images.unsplash.com/photo-1735639013995-086e648eaa38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMHdvcmtzaG9wJTIwYnJhaW5zdG9ybXxlbnwxfHx8fDE3NzE3MTY2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  avatar1:
    "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  avatar2:
    "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcxNjEyNDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  avatar3:
    "https://images.unsplash.com/photo-1736939666660-d4c776e0532c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2R1Y3QlMjBtYW5hZ2VyJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTcxNjY1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  avatar4:
    "https://images.unsplash.com/photo-1758599543154-76ec1c4257df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnRyZXByZW5ldXIlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MTcxNTM3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

/* ── Shared testimonials pool ─────────────────────────────────────── */

const TESTIMONIALS_POOL: ServiceTestimonial[] = [
  {
    name: "James Carter",
    role: "CTO, TechFlow",
    avatar: IMG.avatar1,
    text: "Delivered ahead of schedule with exceptional quality. The team understood our vision from day one.",
  },
  {
    name: "Sarah Kim",
    role: "Product Lead, NovaBridge",
    avatar: IMG.avatar2,
    text: "Transformed our outdated platform into a modern, scalable solution. ROI was visible within the first month.",
  },
  {
    name: "Elena Vasquez",
    role: "CEO, LaunchGrid",
    avatar: IMG.avatar3,
    text: "Professional, responsive, and technically outstanding. They handled every edge case we threw at them.",
  },
  {
    name: "Marcus Webb",
    role: "Founder, DataPulse",
    avatar: IMG.avatar4,
    text: "The best technical team we have ever worked with. Period. Will hire again for our next project.",
  },
];

/* ── Categories ──────────────────────────────────────────────────────── */

export const catalogCategories: CatalogCategory[] = [
  { slug: "all", label: "All Services" },
  { slug: "development", label: "Development" },
  { slug: "design", label: "Design" },
  { slug: "consulting", label: "Consulting" },
  { slug: "infrastructure", label: "Infrastructure" },
];

/* ── Products ────────────────────────────────────────────────────────── */

export const catalogProducts: ServiceProduct[] = [
  {
    id: "srv-web",
    slug: "website-development",
    title: "Website Development",
    subtitle: "Custom websites built for performance",
    category: "development",
    price: 4999,
    priceLabel: "from $4,999",
    badge: "Popular",
    image: IMG.web,
    shortDescription:
      "Full-cycle website development — from landing pages to complex multi-page portals with CMS integration and responsive design.",
    heroDescription:
      "We build fast, beautiful, and conversion-optimized websites tailored to your brand. From single-page marketing sites to full-scale web portals with CMS, ecommerce, and analytics — every project is engineered for performance and maintainability.",
    features: [
      {
        icon: Globe,
        title: "Responsive Design",
        desc: "Pixel-perfect layouts that work flawlessly across all devices and screen sizes.",
      },
      {
        icon: Code,
        title: "Clean Code",
        desc: "Modern tech stack with React, Next.js, or static generators — optimized for speed.",
      },
      {
        icon: TrendingUp,
        title: "SEO Ready",
        desc: "Built-in SEO best practices, structured data, and Core Web Vitals optimization.",
      },
      {
        icon: Layers,
        title: "CMS Integration",
        desc: "Content management through headless CMS or custom admin panels.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Discovery & Brief",
        desc: "We analyze your business goals, audience, and competitors to define the project scope.",
      },
      {
        step: 2,
        title: "Design & Prototyping",
        desc: "Wireframes and high-fidelity mockups reviewed and approved before any code is written.",
      },
      {
        step: 3,
        title: "Development & QA",
        desc: "Iterative development with weekly demos, cross-browser testing, and performance audits.",
      },
      {
        step: 4,
        title: "Launch & Support",
        desc: "Deployment, monitoring setup, and 30 days of post-launch support included.",
      },
    ],
    stats: [
      { value: "150+", label: "Websites Delivered" },
      { value: "99.8%", label: "Uptime Guarantee" },
      { value: "<1.5s", label: "Avg. Load Time" },
      { value: "4.9/5", label: "Client Rating" },
    ],
    faq: [
      {
        q: "What tech stack do you use?",
        a: "We primarily use React / Next.js with Tailwind CSS, but we adapt to your existing stack if needed — Vue, Nuxt, Astro, or plain HTML/CSS.",
      },
      {
        q: "How long does a typical project take?",
        a: "A standard marketing website takes 4-6 weeks. Complex portals with CMS and integrations can take 8-12 weeks.",
      },
      {
        q: "Do you provide hosting?",
        a: "We recommend and set up hosting on Vercel, Netlify, or your preferred cloud provider. Hosting costs are separate.",
      },
      {
        q: "What about ongoing maintenance?",
        a: "We offer monthly maintenance packages starting at $299/mo covering updates, backups, and minor changes.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[0], TESTIMONIALS_POOL[1]],
    deliverables: [
      "Responsive website",
      "CMS setup",
      "SEO configuration",
      "Analytics integration",
      "Performance optimization",
      "Source code handoff",
    ],
    techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
    relatedSlugs: ["ui-ux-design", "seo-optimization", "consulting"],
    galleryImages: [IMG.web, IMG.saas, IMG.ux],
    ctaTitle: "Ready to build your website?",
    ctaDescription:
      "Get a free consultation and project estimate within 24 hours.",
  },
  {
    id: "srv-consulting",
    slug: "consulting",
    title: "Technical Consulting",
    subtitle: "Expert guidance for your tech decisions",
    category: "consulting",
    price: 250,
    priceLabel: "$250/hr",
    image: IMG.consulting,
    shortDescription:
      "Strategic technical advice on architecture, stack selection, team structure, and digital transformation for startups and enterprises.",
    heroDescription:
      "Our senior engineers and architects provide hands-on technical consulting to help you make the right decisions — whether you're choosing a tech stack, refactoring legacy systems, or scaling your infrastructure for growth.",
    features: [
      {
        icon: ClipboardList,
        title: "Architecture Review",
        desc: "Deep analysis of your system architecture with actionable recommendations.",
      },
      {
        icon: Layers,
        title: "Stack Selection",
        desc: "Data-driven guidance on technology choices based on your team size and goals.",
      },
      {
        icon: TrendingUp,
        title: "Scaling Strategy",
        desc: "Roadmaps for horizontal and vertical scaling as your user base grows.",
      },
      {
        icon: MessageSquare,
        title: "Team Mentoring",
        desc: "Code review sessions and best-practice workshops for your development team.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Initial Assessment",
        desc: "A comprehensive review of your current technical landscape and pain points.",
      },
      {
        step: 2,
        title: "Strategy Report",
        desc: "Detailed report with prioritized recommendations and implementation timeline.",
      },
      {
        step: 3,
        title: "Implementation Support",
        desc: "Hands-on guidance during execution — code reviews, pair programming, architecture decisions.",
      },
      {
        step: 4,
        title: "Knowledge Transfer",
        desc: "Documentation, training sessions, and handoff to ensure your team is self-sufficient.",
      },
    ],
    stats: [
      { value: "80+", label: "Clients Advised" },
      { value: "12+", label: "Years Experience" },
      { value: "35%", label: "Avg. Cost Reduction" },
      { value: "100%", label: "Satisfaction Rate" },
    ],
    faq: [
      {
        q: "What does a consulting session look like?",
        a: "Sessions are typically 2-hour blocks via video call. We review your codebase, architecture, or specific challenges and provide immediate feedback with follow-up recommendations.",
      },
      {
        q: "Can you consult on non-technical topics?",
        a: "Our focus is technical architecture, but we often advise on team structure, hiring, and development processes.",
      },
      {
        q: "Is there a minimum engagement?",
        a: "We recommend at least 4 hours for meaningful results, but single sessions are available for quick questions.",
      },
      {
        q: "Do you sign NDAs?",
        a: "Yes, we sign NDAs before every engagement. Confidentiality is non-negotiable.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[2], TESTIMONIALS_POOL[3]],
    deliverables: [
      "Architecture review report",
      "Tech stack recommendations",
      "Scaling roadmap",
      "Risk assessment",
      "Team training sessions",
    ],
    techStack: ["System Design", "AWS", "GCP", "Kubernetes", "CI/CD"],
    relatedSlugs: [
      "technical-audit",
      "cloud-infrastructure",
      "saas-development",
    ],
    galleryImages: [IMG.consulting, IMG.workshop, IMG.audit],
    ctaTitle: "Need expert technical guidance?",
    ctaDescription:
      "Book a free 30-minute discovery call to discuss your challenges.",
  },
  {
    id: "srv-saas",
    slug: "saas-development",
    title: "SaaS Development",
    subtitle: "Build your software-as-a-service product",
    category: "development",
    price: 14999,
    priceLabel: "from $14,999",
    badge: "Enterprise",
    image: IMG.saas,
    shortDescription:
      "End-to-end SaaS product development — multi-tenant architecture, billing integration, user management, and scalable infrastructure.",
    heroDescription:
      "We architect and build SaaS products from the ground up. Multi-tenant architecture, subscription billing, role-based access control, analytics dashboards, and API-first design — everything you need to launch and scale a software product.",
    features: [
      {
        icon: Layers,
        title: "Multi-Tenant Architecture",
        desc: "Isolated tenant data with shared infrastructure for cost-efficient scaling.",
      },
      {
        icon: ShieldCheck,
        title: "Auth & RBAC",
        desc: "Enterprise-grade authentication with SSO, OAuth, and granular permissions.",
      },
      {
        icon: Code,
        title: "API-First Design",
        desc: "RESTful APIs with OpenAPI docs, webhooks, and SDK generation.",
      },
      {
        icon: TrendingUp,
        title: "Billing & Subscriptions",
        desc: "Stripe integration with metered billing, trials, and plan management.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Product Strategy",
        desc: "Define your MVP scope, user personas, and go-to-market technical requirements.",
      },
      {
        step: 2,
        title: "Architecture & Design",
        desc: "System design, database schema, API contracts, and UI/UX wireframes.",
      },
      {
        step: 3,
        title: "Iterative Development",
        desc: "2-week sprints with continuous delivery — each sprint ends with a deployable increment.",
      },
      {
        step: 4,
        title: "Launch & Scale",
        desc: "Production deployment, load testing, monitoring, and ongoing feature development.",
      },
    ],
    stats: [
      { value: "25+", label: "SaaS Products Built" },
      { value: "2M+", label: "End Users Served" },
      { value: "99.95%", label: "Avg. Uptime" },
      { value: "3-6mo", label: "Time to MVP" },
    ],
    faq: [
      {
        q: "Can you build on top of our existing codebase?",
        a: "Absolutely. We can integrate into existing projects or start from scratch — whatever makes the most sense for your timeline and budget.",
      },
      {
        q: "What billing providers do you integrate with?",
        a: "We primarily work with Stripe, but also support Paddle, LemonSqueezy, and custom billing solutions.",
      },
      {
        q: "Do you handle DevOps and infrastructure?",
        a: "Yes. We set up CI/CD pipelines, containerized deployments, monitoring, and auto-scaling as part of every SaaS project.",
      },
      {
        q: "What about post-launch support?",
        a: "We offer dedicated development teams for ongoing feature work, bug fixes, and scaling — billed monthly or per-sprint.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[0], TESTIMONIALS_POOL[3]],
    deliverables: [
      "Full SaaS application",
      "Admin dashboard",
      "API documentation",
      "Billing integration",
      "CI/CD pipeline",
      "Monitoring & alerting",
    ],
    techStack: [
      "React",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "Stripe",
      "Docker",
      "AWS",
    ],
    relatedSlugs: [
      "website-development",
      "cloud-infrastructure",
      "api-integration",
    ],
    galleryImages: [IMG.saas, IMG.api, IMG.cloud],
    ctaTitle: "Ready to launch your SaaS?",
    ctaDescription:
      "Let's discuss your product idea and build a roadmap together.",
  },
  {
    id: "srv-mobile",
    slug: "mobile-app-development",
    title: "Mobile App Development",
    subtitle: "Native and cross-platform mobile apps",
    category: "development",
    price: 9999,
    priceLabel: "from $9,999",
    image: IMG.mobile,
    shortDescription:
      "iOS and Android app development using React Native or Flutter — from concept to App Store and Google Play submission.",
    heroDescription:
      "We build high-performance mobile applications for iOS and Android using cross-platform frameworks. From consumer-facing apps to enterprise tools — every app is designed for usability, performance, and seamless integration with your backend systems.",
    features: [
      {
        icon: Smartphone,
        title: "Cross-Platform",
        desc: "Single codebase for iOS and Android with React Native or Flutter.",
      },
      {
        icon: Palette,
        title: "Native UX",
        desc: "Platform-specific design patterns for natural, intuitive user experience.",
      },
      {
        icon: Code,
        title: "Backend Integration",
        desc: "Seamless connection to your existing APIs, databases, and third-party services.",
      },
      {
        icon: TrendingUp,
        title: "Analytics & Tracking",
        desc: "Built-in analytics, crash reporting, and A/B testing infrastructure.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Requirements & UX",
        desc: "User flow mapping, feature prioritization, and interactive prototypes.",
      },
      {
        step: 2,
        title: "Design System",
        desc: "Complete design system with components, typography, and platform-specific adaptations.",
      },
      {
        step: 3,
        title: "Development",
        desc: "Modular development with continuous integration and automated testing.",
      },
      {
        step: 4,
        title: "Store Submission",
        desc: "App Store and Google Play submission, review handling, and launch support.",
      },
    ],
    stats: [
      { value: "40+", label: "Apps Shipped" },
      { value: "4.7/5", label: "Avg. Store Rating" },
      { value: "500K+", label: "Total Downloads" },
      { value: "2", label: "Platforms" },
    ],
    faq: [
      {
        q: "React Native or Flutter?",
        a: "It depends on your project. React Native is better if you have an existing React web team. Flutter offers better animation performance and custom UI. We advise based on your specific needs.",
      },
      {
        q: "Do you handle App Store submissions?",
        a: "Yes. We manage the entire submission process including screenshots, descriptions, review responses, and compliance.",
      },
      {
        q: "Can the app work offline?",
        a: "We implement offline-first architectures with local storage and background sync when connectivity is needed.",
      },
      {
        q: "What about push notifications?",
        a: "Included in every project. We integrate with Firebase Cloud Messaging or your preferred push notification service.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[1], TESTIMONIALS_POOL[2]],
    deliverables: [
      "iOS app",
      "Android app",
      "Backend API",
      "Push notifications",
      "Store listings",
      "Source code",
    ],
    techStack: [
      "React Native",
      "Flutter",
      "TypeScript",
      "Firebase",
      "Fastlane",
    ],
    relatedSlugs: ["ui-ux-design", "api-integration", "website-development"],
    galleryImages: [IMG.mobile, IMG.ux, IMG.web],
    ctaTitle: "Have a mobile app idea?",
    ctaDescription: "Get a free project estimate and timeline in 48 hours.",
  },
  {
    id: "srv-uiux",
    slug: "ui-ux-design",
    title: "UI/UX Design",
    subtitle: "User-centered design that converts",
    category: "design",
    price: 3499,
    priceLabel: "from $3,499",
    image: IMG.ux,
    shortDescription:
      "Research-driven UX design and polished UI — wireframes, prototypes, design systems, and usability testing.",
    heroDescription:
      "Design is not just how it looks — it's how it works. We create intuitive, accessible, and visually stunning interfaces backed by user research, competitive analysis, and iterative testing. Every pixel serves a purpose.",
    features: [
      {
        icon: Palette,
        title: "Visual Design",
        desc: "Modern, clean aesthetics aligned with your brand identity and market positioning.",
      },
      {
        icon: MessageSquare,
        title: "User Research",
        desc: "Interviews, surveys, and analytics-driven insights that inform every design decision.",
      },
      {
        icon: Layers,
        title: "Design System",
        desc: "Reusable component libraries with tokens, variants, and documentation for your dev team.",
      },
      {
        icon: Smartphone,
        title: "Responsive & Accessible",
        desc: "WCAG-compliant designs that work beautifully on every device and for every user.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Research & Audit",
        desc: "User interviews, competitive analysis, and heuristic evaluation of existing products.",
      },
      {
        step: 2,
        title: "Wireframes & Flows",
        desc: "Low-fidelity wireframes and user flow diagrams for validation before visual design.",
      },
      {
        step: 3,
        title: "High-Fidelity Design",
        desc: "Polished mockups in Figma with interactive prototypes for stakeholder review.",
      },
      {
        step: 4,
        title: "Handoff & Testing",
        desc: "Developer-ready specs with design tokens, and usability testing with real users.",
      },
    ],
    stats: [
      { value: "200+", label: "Projects Designed" },
      { value: "40%", label: "Avg. Conversion Lift" },
      { value: "95%", label: "Usability Score" },
      { value: "48hr", label: "First Concepts" },
    ],
    faq: [
      {
        q: "Do you work in Figma?",
        a: "Yes, Figma is our primary tool. We deliver organized Figma files with components, auto-layout, and design tokens.",
      },
      {
        q: "Can you redesign an existing product?",
        a: "Absolutely. We often start with a UX audit of the current product and then redesign based on data and user feedback.",
      },
      {
        q: "Do you do branding?",
        a: "We focus on product design (UI/UX), but we can create a visual identity system including logos, color palettes, and typography.",
      },
      {
        q: "How do you collaborate with developers?",
        a: "We use Figma Dev Mode, Storybook, and shared design tokens to ensure pixel-perfect implementation.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[1], TESTIMONIALS_POOL[3]],
    deliverables: [
      "Figma design files",
      "Interactive prototypes",
      "Design system",
      "Style guide",
      "Usability report",
      "Asset exports",
    ],
    techStack: ["Figma", "Storybook", "Design Tokens", "Accessibility Testing"],
    relatedSlugs: [
      "website-development",
      "mobile-app-development",
      "consulting",
    ],
    galleryImages: [IMG.ux, IMG.web, IMG.mobile],
    ctaTitle: "Need a design that performs?",
    ctaDescription:
      "Share your project brief and get design concepts within 48 hours.",
  },
  {
    id: "srv-seo",
    slug: "seo-optimization",
    title: "SEO Optimization",
    subtitle: "Grow your organic traffic",
    category: "consulting",
    price: 1499,
    priceLabel: "from $1,499/mo",
    image: IMG.seo,
    shortDescription:
      "Technical SEO audits, on-page optimization, content strategy, and link building — data-driven growth for organic search.",
    heroDescription:
      "We don't just optimize for search engines — we build sustainable organic growth strategies. Technical audits, content planning, on-page optimization, and link building — all tracked with transparent reporting and clear KPIs.",
    features: [
      {
        icon: TrendingUp,
        title: "Technical SEO",
        desc: "Site speed, crawlability, indexation, and Core Web Vitals optimization.",
      },
      {
        icon: Globe,
        title: "On-Page Optimization",
        desc: "Meta tags, structured data, internal linking, and content optimization.",
      },
      {
        icon: Code,
        title: "Content Strategy",
        desc: "Keyword research, topic clustering, and editorial calendar planning.",
      },
      {
        icon: Layers,
        title: "Link Building",
        desc: "White-hat outreach, guest posting, and digital PR for authority growth.",
      },
    ],
    process: [
      {
        step: 1,
        title: "SEO Audit",
        desc: "Comprehensive technical and content audit with 100+ checkpoint analysis.",
      },
      {
        step: 2,
        title: "Strategy & Roadmap",
        desc: "Prioritized action plan with estimated impact and timeline for each initiative.",
      },
      {
        step: 3,
        title: "Implementation",
        desc: "Hands-on optimization — we fix issues, create content, and build links.",
      },
      {
        step: 4,
        title: "Reporting & Iteration",
        desc: "Monthly reports with ranking changes, traffic growth, and next steps.",
      },
    ],
    stats: [
      { value: "300%", label: "Avg. Traffic Growth" },
      { value: "60+", label: "Clients Ranked" },
      { value: "#1-3", label: "Target Positions" },
      { value: "6mo", label: "Avg. Time to Results" },
    ],
    faq: [
      {
        q: "How long until we see results?",
        a: "SEO is a long-term investment. Most clients see measurable improvements in 3-4 months, with significant growth by month 6.",
      },
      {
        q: "Do you guarantee rankings?",
        a: "No one can guarantee specific rankings. We guarantee transparent reporting, best practices, and consistent effort toward your goals.",
      },
      {
        q: "Do you create content?",
        a: "Yes, we have in-house content writers who create SEO-optimized articles, landing pages, and technical documentation.",
      },
      {
        q: "What tools do you use?",
        a: "Ahrefs, Search Console, Google Analytics 4, Screaming Frog, and custom dashboards for reporting.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[0], TESTIMONIALS_POOL[2]],
    deliverables: [
      "SEO audit report",
      "Keyword strategy",
      "Monthly optimization",
      "Content creation",
      "Ranking reports",
      "Competitor analysis",
    ],
    techStack: [
      "Ahrefs",
      "Google Search Console",
      "GA4",
      "Schema.org",
      "PageSpeed",
    ],
    relatedSlugs: ["website-development", "consulting", "technical-audit"],
    galleryImages: [IMG.seo, IMG.web, IMG.consulting],
    ctaTitle: "Want to dominate organic search?",
    ctaDescription:
      "Get a free SEO audit and discover your growth opportunities.",
  },
  {
    id: "srv-api",
    slug: "api-integration",
    title: "API Integration",
    subtitle: "Connect your systems seamlessly",
    category: "development",
    price: 2999,
    priceLabel: "from $2,999",
    image: IMG.api,
    shortDescription:
      "Custom API development, third-party integrations, webhook systems, and data synchronization between platforms.",
    heroDescription:
      "We build robust API integrations that connect your tools, platforms, and data sources. Whether it's Stripe, Salesforce, Slack, or a custom internal API — we design reliable, well-documented integration layers that just work.",
    features: [
      {
        icon: Code,
        title: "REST & GraphQL APIs",
        desc: "Design and implementation of clean, versioned APIs with comprehensive documentation.",
      },
      {
        icon: Layers,
        title: "Third-Party Integrations",
        desc: "Connect with payment processors, CRMs, ERPs, and SaaS platforms.",
      },
      {
        icon: TrendingUp,
        title: "Data Sync",
        desc: "Real-time and batch synchronization between systems with conflict resolution.",
      },
      {
        icon: ShieldCheck,
        title: "Security & Auth",
        desc: "OAuth 2.0, API keys, rate limiting, and request signing for secure integrations.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Integration Mapping",
        desc: "Document all data flows, endpoints, and transformation requirements.",
      },
      {
        step: 2,
        title: "API Design",
        desc: "OpenAPI specs, error handling patterns, and versioning strategy.",
      },
      {
        step: 3,
        title: "Implementation",
        desc: "Build, test, and deploy integrations with comprehensive error handling and retry logic.",
      },
      {
        step: 4,
        title: "Monitoring",
        desc: "Set up alerting, logging, and dashboards to ensure integrations stay healthy.",
      },
    ],
    stats: [
      { value: "100+", label: "APIs Integrated" },
      { value: "99.9%", label: "Reliability Rate" },
      { value: "50+", label: "Platforms Connected" },
      { value: "<200ms", label: "Avg. Response Time" },
    ],
    faq: [
      {
        q: "Which third-party services do you work with?",
        a: "We have experience with Stripe, Twilio, SendGrid, Salesforce, HubSpot, Slack, Jira, Shopify, and hundreds more.",
      },
      {
        q: "Can you build custom APIs?",
        a: "Yes. We design and build RESTful and GraphQL APIs from scratch, including authentication, documentation, and SDKs.",
      },
      {
        q: "How do you handle API versioning?",
        a: "We implement URL-based or header-based versioning with graceful deprecation policies and migration guides.",
      },
      {
        q: "What about error handling?",
        a: "Every integration includes retry logic, circuit breakers, dead-letter queues, and alerting for failed operations.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[3], TESTIMONIALS_POOL[1]],
    deliverables: [
      "API documentation",
      "Integration layer",
      "Error handling",
      "Monitoring setup",
      "SDKs",
      "Migration scripts",
    ],
    techStack: ["Node.js", "Python", "REST", "GraphQL", "OpenAPI", "Postman"],
    relatedSlugs: [
      "saas-development",
      "cloud-infrastructure",
      "technical-audit",
    ],
    galleryImages: [IMG.api, IMG.saas, IMG.cloud],
    ctaTitle: "Need to connect your systems?",
    ctaDescription:
      "Tell us about your integration requirements and get a proposal within 48 hours.",
  },
  {
    id: "srv-cloud",
    slug: "cloud-infrastructure",
    title: "Cloud Infrastructure",
    subtitle: "Scalable, reliable cloud setups",
    category: "infrastructure",
    price: 3999,
    priceLabel: "from $3,999",
    image: IMG.cloud,
    shortDescription:
      "Cloud architecture design, Kubernetes deployment, CI/CD pipelines, monitoring, and cost optimization on AWS, GCP, or Azure.",
    heroDescription:
      "We design and implement cloud infrastructure that scales with your business. From initial architecture on AWS, GCP, or Azure to Kubernetes orchestration, CI/CD automation, and cost optimization — we build infrastructure that's reliable, secure, and efficient.",
    features: [
      {
        icon: Cloud,
        title: "Cloud Architecture",
        desc: "Scalable, fault-tolerant designs on AWS, GCP, or Azure tailored to your workload.",
      },
      {
        icon: Code,
        title: "CI/CD Pipelines",
        desc: "Automated build, test, and deployment workflows for rapid, safe releases.",
      },
      {
        icon: ShieldCheck,
        title: "Security Hardening",
        desc: "Network policies, IAM, encryption, and compliance configurations.",
      },
      {
        icon: TrendingUp,
        title: "Cost Optimization",
        desc: "Right-sizing, reserved instances, and usage monitoring to reduce cloud spend.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Infrastructure Audit",
        desc: "Review current setup, identify bottlenecks, and define target architecture.",
      },
      {
        step: 2,
        title: "Architecture Design",
        desc: "Diagrams, IaC templates, and cost projections for the new infrastructure.",
      },
      {
        step: 3,
        title: "Migration & Setup",
        desc: "Zero-downtime migration with containerization, orchestration, and automation.",
      },
      {
        step: 4,
        title: "Monitoring & Handoff",
        desc: "Observability stack, runbooks, and training for your ops team.",
      },
    ],
    stats: [
      { value: "45%", label: "Avg. Cost Savings" },
      { value: "99.99%", label: "Target Uptime" },
      { value: "50+", label: "Migrations Done" },
      { value: "3", label: "Cloud Providers" },
    ],
    faq: [
      {
        q: "Which cloud provider do you recommend?",
        a: "It depends on your needs. AWS for breadth, GCP for data/ML, Azure for Microsoft ecosystem. We help you choose.",
      },
      {
        q: "Can you migrate from on-premise?",
        a: "Yes. We have extensive experience migrating from bare-metal and on-premise setups to cloud with zero downtime.",
      },
      {
        q: "Do you use Infrastructure as Code?",
        a: "Always. We use Terraform, Pulumi, or CloudFormation to ensure every piece of infrastructure is version-controlled and reproducible.",
      },
      {
        q: "What about Kubernetes?",
        a: "We deploy and manage K8s clusters on EKS, GKE, or AKS — including Helm charts, service mesh, and auto-scaling.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[2], TESTIMONIALS_POOL[0]],
    deliverables: [
      "Architecture diagrams",
      "IaC templates",
      "CI/CD pipeline",
      "Monitoring stack",
      "Runbooks",
      "Cost analysis",
    ],
    techStack: [
      "AWS",
      "GCP",
      "Terraform",
      "Kubernetes",
      "Docker",
      "Prometheus",
    ],
    relatedSlugs: ["saas-development", "api-integration", "technical-audit"],
    galleryImages: [IMG.cloud, IMG.api, IMG.saas],
    ctaTitle: "Need a rock-solid infrastructure?",
    ctaDescription: "Get a free infrastructure assessment and cost projection.",
  },
  {
    id: "srv-audit",
    slug: "technical-audit",
    title: "Technical Audit",
    subtitle: "Find and fix what's holding you back",
    category: "consulting",
    price: 1999,
    priceLabel: "from $1,999",
    image: IMG.audit,
    shortDescription:
      "Comprehensive code quality, security, performance, and architecture audit with a prioritized action plan.",
    heroDescription:
      "Our technical audits go beyond surface-level checks. We review your codebase, architecture, security posture, performance bottlenecks, and development practices — then deliver a prioritized report with concrete recommendations and estimated effort for each fix.",
    features: [
      {
        icon: ShieldCheck,
        title: "Security Review",
        desc: "OWASP-aligned vulnerability assessment, dependency auditing, and access control review.",
      },
      {
        icon: Code,
        title: "Code Quality",
        desc: "Architecture patterns, code style, test coverage, and technical debt analysis.",
      },
      {
        icon: TrendingUp,
        title: "Performance Audit",
        desc: "Load testing, profiling, database query analysis, and caching strategy review.",
      },
      {
        icon: ClipboardList,
        title: "Process Review",
        desc: "CI/CD pipelines, deployment practices, monitoring, and incident response evaluation.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Access & Scope",
        desc: "Define audit scope and provide secure access to repositories and infrastructure.",
      },
      {
        step: 2,
        title: "Deep Analysis",
        desc: "40+ hours of hands-on review by senior engineers across all audit dimensions.",
      },
      {
        step: 3,
        title: "Report & Presentation",
        desc: "Detailed report with severity ratings, recommendations, and effort estimates.",
      },
      {
        step: 4,
        title: "Follow-Up",
        desc: "Q&A session and optional implementation support for critical findings.",
      },
    ],
    stats: [
      { value: "120+", label: "Audits Completed" },
      { value: "40hrs", label: "Avg. Audit Depth" },
      { value: "200+", label: "Checkpoints" },
      { value: "85%", label: "Issues Resolved" },
    ],
    faq: [
      {
        q: "How long does an audit take?",
        a: "A standard audit takes 1-2 weeks depending on codebase size. We deliver the report within 3 business days of completion.",
      },
      {
        q: "What do you need from us?",
        a: "Read access to your repositories, staging environment access, and a 1-hour kickoff call to understand context.",
      },
      {
        q: "Is the audit confidential?",
        a: "Absolutely. We sign NDAs before every engagement and delete all access credentials after the audit is complete.",
      },
      {
        q: "Can you fix the issues you find?",
        a: "Yes. We offer implementation packages to address audit findings, priced separately based on scope and severity.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[3], TESTIMONIALS_POOL[2]],
    deliverables: [
      "Audit report (PDF)",
      "Executive summary",
      "Issue tracker import",
      "Priority matrix",
      "Architecture recommendations",
      "Follow-up session",
    ],
    techStack: ["SonarQube", "OWASP ZAP", "k6", "Lighthouse", "Custom Scripts"],
    relatedSlugs: ["consulting", "cloud-infrastructure", "seo-optimization"],
    galleryImages: [IMG.audit, IMG.consulting, IMG.cloud],
    ctaTitle: "Worried about technical debt?",
    ctaDescription: "Get a comprehensive audit and a clear action plan.",
  },
  {
    id: "srv-workshop",
    slug: "team-workshop",
    title: "Team Workshop",
    subtitle: "Level up your engineering team",
    category: "consulting",
    price: 2499,
    priceLabel: "from $2,499/day",
    image: IMG.workshop,
    shortDescription:
      "Hands-on workshops for engineering teams — React, TypeScript, system design, DevOps practices, and code quality.",
    heroDescription:
      "Invest in your team's growth with hands-on workshops led by senior engineers. We cover modern frontend, backend patterns, system design, and DevOps — with practical exercises, real-world examples, and take-home materials your team can reference long after the workshop ends.",
    features: [
      {
        icon: MessageSquare,
        title: "Interactive Format",
        desc: "Live coding, pair exercises, and Q&A — not just slides and lectures.",
      },
      {
        icon: Layers,
        title: "Custom Curriculum",
        desc: "Workshop content tailored to your team's current skill level and learning goals.",
      },
      {
        icon: Code,
        title: "Practical Exercises",
        desc: "Real-world scenarios and codebases that mirror your team's daily work.",
      },
      {
        icon: ClipboardList,
        title: "Follow-Up Support",
        desc: "2 weeks of async Q&A after the workshop to reinforce learning.",
      },
    ],
    process: [
      {
        step: 1,
        title: "Needs Assessment",
        desc: "Survey your team, review your codebase, and define learning objectives.",
      },
      {
        step: 2,
        title: "Curriculum Design",
        desc: "Custom workshop outline with exercises based on your tech stack and challenges.",
      },
      {
        step: 3,
        title: "Workshop Delivery",
        desc: "Full-day or multi-day sessions — remote or on-site at your office.",
      },
      {
        step: 4,
        title: "Follow-Up",
        desc: "Materials handoff, recordings, and 2 weeks of async support.",
      },
    ],
    stats: [
      { value: "50+", label: "Workshops Delivered" },
      { value: "500+", label: "Engineers Trained" },
      { value: "4.8/5", label: "Avg. Rating" },
      { value: "8hrs", label: "Per Day" },
    ],
    faq: [
      {
        q: "What topics do you cover?",
        a: "React, TypeScript, Node.js, system design, testing, CI/CD, Kubernetes, and custom topics based on your needs.",
      },
      {
        q: "Can workshops be remote?",
        a: "Yes. We deliver workshops via Zoom/Meet with interactive exercises, shared coding environments, and breakout rooms.",
      },
      {
        q: "What's the ideal group size?",
        a: "6-15 engineers for optimal interaction. Larger groups work with additional facilitators.",
      },
      {
        q: "Do you provide materials after the workshop?",
        a: "Yes. Every participant gets slides, exercise repos, cheat sheets, and access to workshop recordings.",
      },
    ],
    testimonials: [TESTIMONIALS_POOL[0], TESTIMONIALS_POOL[1]],
    deliverables: [
      "Custom curriculum",
      "Workshop slides",
      "Exercise repositories",
      "Recordings",
      "Cheat sheets",
      "Follow-up Q&A",
    ],
    techStack: ["React", "TypeScript", "Node.js", "Docker", "Testing"],
    relatedSlugs: ["consulting", "technical-audit", "ui-ux-design"],
    galleryImages: [IMG.workshop, IMG.consulting, IMG.web],
    ctaTitle: "Want to upskill your team?",
    ctaDescription:
      "Tell us about your team and we'll design the perfect workshop.",
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────── */

export function getProductBySlug(slug: string): ServiceProduct | undefined {
  return catalogProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): ServiceProduct[] {
  if (category === "all") return catalogProducts;
  return catalogProducts.filter((p) => p.category === category);
}

export function getRelatedProducts(product: ServiceProduct): ServiceProduct[] {
  return product.relatedSlugs
    .map((s) => catalogProducts.find((p) => p.slug === s))
    .filter(Boolean) as ServiceProduct[];
}
