/* ─── Blog mock data for the public site ─────────────────────────────── */

export interface BlogCategory {
  slug: string;
  label: string;
  count: number;
}

export interface BlogAuthor {
  name: string;
  slug: string;
  role: string;
  avatar: string;
  bio: string;
  location: string;
  joinedDate: string;
  website: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  skills: string[];
}

export interface BlogComment {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies?: BlogComment[];
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: BlogAuthor;
  date: string;
  readTime: string;
  comments: BlogComment[];
  pinnedProductIds: string[];
}

export interface BlogProduct {
  id: string;
  title: string;
  slug: string;
  type: string;
  shortDescription: string;
  price: string;
  priceLabel?: string;
  category?: string;
}

/* ── Authors ─────────────────────────────────────────────────────────── */

const AUTHORS: Record<string, BlogAuthor> = {
  sarah: {
    name: "Sarah Kim",
    slug: "sarah-kim",
    role: "Head of Product",
    avatar:
      "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwZGV2ZWxvcGVyJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    bio: "Sarah Kim is the Head of Product at SPS Dev, leading the development of innovative solutions for modern businesses. With over 10 years of experience in product management, she focuses on creating user-centric products that drive growth and efficiency.",
    location: "San Francisco, CA",
    joinedDate: "2015-06-01",
    website: "https://sarahkim.com",
    socials: {
      twitter: "https://twitter.com/sarahkim",
      linkedin: "https://linkedin.com/in/sarahkim",
      github: "https://github.com/sarahkim",
    },
    skills: ["Product Management", "User Experience", "Agile Methodologies"],
  },
  james: {
    name: "James Carter",
    slug: "james-carter",
    role: "CTO",
    avatar:
      "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    bio: "James Carter is the CTO of SPS Dev, overseeing the technical direction and architecture of the platform. With a background in software engineering and a passion for building scalable systems, he ensures that our solutions are robust and future-proof.",
    location: "New York, NY",
    joinedDate: "2014-03-15",
    website: "https://jamescarter.com",
    socials: {
      twitter: "https://twitter.com/jamescarter",
      linkedin: "https://linkedin.com/in/jamescarter",
      github: "https://github.com/jamescarter",
    },
    skills: ["Software Engineering", "System Architecture", "DevOps"],
  },
  marcus: {
    name: "Marcus Webb",
    slug: "marcus-webb",
    role: "Lead Engineer",
    avatar:
      "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxNzE1ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    bio: "Marcus Webb is the Lead Engineer at SPS Dev, responsible for leading the engineering team and driving the development of new features. With expertise in backend development and a focus on performance optimization, he ensures that our platform is reliable and efficient.",
    location: "Seattle, WA",
    joinedDate: "2016-08-22",
    website: "https://marcuswebb.com",
    socials: {
      twitter: "https://twitter.com/marcuswebb",
      linkedin: "https://linkedin.com/in/marcuswebb",
      github: "https://github.com/marcuswebb",
    },
    skills: ["Backend Development", "Performance Optimization", "Code Review"],
  },
};

/* ── Categories ──────────────────────────────────────────────────────── */

export const blogCategories: BlogCategory[] = [
  { slug: "all", label: "All Posts", count: 6 },
  { slug: "guides", label: "Guides", count: 2 },
  { slug: "engineering", label: "Engineering", count: 2 },
  { slug: "product", label: "Product", count: 1 },
  { slug: "case-study", label: "Case Studies", count: 1 },
];

/* ── Products (mirrors data.ts, public-facing view) ──────────────────── */

export const blogProducts: BlogProduct[] = [
  {
    id: "srv-consulting",
    title: "Technical Consulting",
    slug: "consulting",
    type: "consulting",
    shortDescription:
      "Expert guidance on architecture, scaling, and technology strategy",
    price: "$2,500",
    priceLabel: "from $2,500",
    category: "consulting",
  },
  {
    id: "srv-saas",
    title: "SaaS Development",
    slug: "saas-development",
    type: "development",
    shortDescription: "Full-cycle SaaS product development from idea to launch",
    price: "$15,000",
    priceLabel: "from $15,000",
    category: "development",
  },
  {
    id: "srv-web",
    title: "Website Development",
    slug: "website-development",
    type: "development",
    shortDescription:
      "Custom websites built with modern frameworks and best practices",
    price: "$3,000",
    priceLabel: "from $3,000",
    category: "development",
  },
  {
    id: "srv-api",
    title: "API Integration",
    slug: "api-integration",
    type: "development",
    shortDescription:
      "Seamless third-party API integrations and custom middleware",
    price: "$2,000",
    priceLabel: "from $2,000",
    category: "development",
  },
  {
    id: "srv-cloud",
    title: "Cloud Infrastructure",
    slug: "cloud-infrastructure",
    type: "infrastructure",
    shortDescription:
      "Scalable cloud architecture, deployment pipelines, and monitoring",
    price: "$4,000",
    priceLabel: "from $4,000",
    category: "infrastructure",
  },
  {
    id: "srv-audit",
    title: "Technical Audit",
    slug: "technical-audit",
    type: "consulting",
    shortDescription:
      "Comprehensive security and performance audit of your systems",
    price: "$1,800",
    priceLabel: "from $1,800",
    category: "consulting",
  },
  {
    id: "srv-uiux",
    title: "UI/UX Design",
    slug: "ui-ux-design",
    type: "design",
    shortDescription:
      "User-centered design, prototyping, and usability testing",
    price: "$3,500",
    priceLabel: "from $3,500",
    category: "design",
  },
  {
    id: "srv-seo",
    title: "SEO Optimization",
    slug: "seo-optimization",
    type: "consulting",
    shortDescription:
      "Data-driven SEO strategy to boost organic traffic and rankings",
    price: "$1,200",
    priceLabel: "from $1,200",
    category: "consulting",
  },
  {
    id: "srv-mobile",
    title: "Mobile App Development",
    slug: "mobile-app-development",
    type: "development",
    shortDescription: "Native and cross-platform mobile applications",
    price: "$8,000",
    priceLabel: "from $8,000",
    category: "development",
  },
  {
    id: "srv-workshop",
    title: "Team Workshop",
    slug: "team-workshop",
    type: "consulting",
    shortDescription:
      "Interactive workshops on architecture, DevOps, and best practices",
    price: "$800",
    priceLabel: "from $800",
    category: "consulting",
  },
];

/* ── Articles ──────────────────���─────────────────────────────────────── */

export const blogArticles: BlogArticle[] = [
  {
    id: "art-1",
    slug: "how-to-choose",
    title: "How to Choose the Right Plan for Your Business",
    excerpt:
      "A comprehensive guide to evaluating subscription tiers, comparing features, and making the right decision for your team size and growth trajectory.",
    content: `
<p>Choosing the right subscription plan can feel overwhelming when every tier offers a different mix of features. This guide breaks down our approach to pricing and helps you make an informed decision.</p>

<h2>Understanding Your Needs</h2>
<p>Before comparing plans, take a step back and assess what your team actually needs. Consider the number of active projects, the modules you'll rely on most, and your expected growth over the next 12 months.</p>

<blockquote>The best plan isn't always the most expensive one — it's the one that grows with you without paying for features you'll never use.</blockquote>

<h2>Comparing Feature Sets</h2>
<p>Our three tiers — <strong>Free</strong>, <strong>Startup</strong>, and <strong>Enterprise</strong> — are designed for different stages of product maturity. The Free tier gives you access to 3 modules and 1 project, perfect for prototyping and personal use.</p>

<p>The Startup plan unlocks all 15 modules, 5 projects, custom domains, and API access. For most growing teams, this is the sweet spot — you get everything you need without the overhead of enterprise-grade compliance features.</p>

<h2>When to Upgrade</h2>
<p>There are a few clear signals that it's time to move up:</p>
<ul>
<li>You're hitting project or storage limits regularly</li>
<li>You need SSO or advanced RBAC controls</li>
<li>Your team has grown beyond 10 active contributors</li>
<li>You require an SLA guarantee for production workloads</li>
</ul>

<h3>Cost Optimization Tips</h3>
<p>Annual billing saves 20% across all paid tiers. If you're committing to a year, it's almost always worth it. You can also start with Startup and upgrade individual features through add-ons before jumping to the full Enterprise plan.</p>

<p>We also offer a 14-day free trial on all paid plans, so you can test everything before making a commitment.</p>
        `,
    coverImage:
      "https://images.unsplash.com/photo-1723987251277-18fc0a1effd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwYW5hbHl0aWNzJTIwY2hhcnQlMjBzY3JlZW58ZW58MXx8fHwxNzcxNjg3NTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "guides",
    tags: ["pricing", "plans", "getting-started"],
    author: AUTHORS.sarah,
    date: "Feb 18, 2026",
    readTime: "7 min read",
    pinnedProductIds: ["srv-consulting", "srv-saas"],
    comments: [
      {
        id: "c1",
        author: "Alex Rivera",
        avatar: "",
        date: "Feb 19, 2026",
        text: "Great breakdown! We were on the fence between Startup and Enterprise, but this made it clear that Startup covers everything we need right now.",
        likes: 12,
        replies: [
          {
            id: "c1r1",
            author: "Sarah Kim",
            avatar: AUTHORS.sarah.avatar,
            date: "Feb 19, 2026",
            text: "Glad it helped, Alex! You can always upgrade later if your needs change.",
            likes: 4,
          },
        ],
      },
      {
        id: "c2",
        author: "Nina Patel",
        avatar: "",
        date: "Feb 20, 2026",
        text: "The annual billing tip saved us quite a bit. Wish I had read this earlier!",
        likes: 8,
      },
    ],
  },
  {
    id: "art-2",
    slug: "new-features",
    title: "New Features in 2026: Everything You Need to Know",
    excerpt:
      "A rundown of the most exciting features shipped in the latest release — from the AI Agent module to the redesigned admin panel.",
    content: `
<p>2026 has been our biggest year yet. We've shipped more features in the first two months than in all of 2025, and we're just getting started. Here's a breakdown of what's new.</p>

<h2>AI Agent Module</h2>
<p>The most requested feature of 2025 is now live. The Agent module lets you create, configure, and deploy AI-powered agents directly from the admin panel. Each agent can be connected to specific data models, given custom instructions, and monitored through built-in analytics.</p>

<h2>Redesigned Admin Panel</h2>
<p>We've completely overhauled the admin experience. The new <strong>Domain Control Center</strong> features a collapsible sidebar with all 15 modules, stacked drawer panels for deep entity editing, and a relation management system that makes it easy to connect entities across modules.</p>

<h3>Key UI Improvements</h3>
<ul>
<li><strong>Stacked drawers</strong> — edit nested entities without losing context</li>
<li><strong>Preview dialog</strong> — viewport switcher for responsive preview</li>
<li><strong>Inline copy</strong> — click any ID field to copy it to clipboard</li>
<li><strong>TipTap editor</strong> — rich-text editing with H1–H6, bold, italic, links</li>
</ul>

<h2>Broadcast Module</h2>
<p>Send messages across channels with the new Broadcast module. Configure channels, compose messages, and track delivery — all from the same admin interface.</p>

<p>We're shipping weekly updates throughout the rest of 2026. Follow our changelog for the latest.</p>
        `,
    coverImage:
      "https://images.unsplash.com/photo-1759884247160-27b8465544b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwb2ZmaWNlJTIwd2hpdGVib2FyZCUyMHBsYW5uaW5nfGVufDF8fHx8MTc3MTcxNTg4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "product",
    tags: ["release", "features", "ai"],
    author: AUTHORS.james,
    date: "Feb 14, 2026",
    readTime: "6 min read",
    pinnedProductIds: ["srv-saas", "srv-uiux"],
    comments: [
      {
        id: "c3",
        author: "Derek Foss",
        avatar: "",
        date: "Feb 15, 2026",
        text: "The stacked drawer pattern is genius. Finally a CMS that handles deep relations properly.",
        likes: 21,
      },
      {
        id: "c4",
        author: "Lena Cho",
        avatar: "",
        date: "Feb 16, 2026",
        text: "Very excited about the AI Agent module. Will there be webhook triggers?",
        likes: 7,
        replies: [
          {
            id: "c4r1",
            author: "James Carter",
            avatar: AUTHORS.james.avatar,
            date: "Feb 16, 2026",
            text: "Yes! Webhook support for agents is on the roadmap for Q2. Stay tuned.",
            likes: 15,
          },
        ],
      },
    ],
  },
  {
    id: "art-3",
    slug: "success-story",
    title: "How NovaBridge Scaled to 100K Users in 6 Months",
    excerpt:
      "A deep dive into how NovaBridge used our modular platform to go from prototype to 100,000 active users in half a year.",
    content: `
<p>When NovaBridge came to us, they were a three-person team with an idea and a tight deadline. Six months later, they had 100,000 active users and a fully operational platform built entirely on our modules.</p>

<h2>The Challenge</h2>
<p>NovaBridge needed to ship an ecommerce platform with social features, a blog, and a billing system — all before their seed funding ran out. Building from scratch would have taken 12+ months.</p>

<h2>The Solution</h2>
<p>By combining our <strong>Ecommerce</strong>, <strong>Social</strong>, <strong>Blog</strong>, and <strong>Billing</strong> modules, they had a working prototype in under two weeks. The relation system connected products to articles, profiles to orders, and everything was manageable from the admin panel.</p>

<blockquote>We saved at least 6 months of development time. The modular approach meant we could focus on what makes our product unique instead of reinventing basic infrastructure. — Lisa Chen, CTO at NovaBridge</blockquote>

<h2>The Results</h2>
<ul>
<li><strong>2 weeks</strong> to MVP</li>
<li><strong>100K users</strong> in 6 months</li>
<li><strong>4 modules</strong> integrated seamlessly</li>
<li><strong>0 custom backend code</strong> for core features</li>
</ul>

<h3>What's Next for NovaBridge</h3>
<p>They're now integrating the AI Agent module to provide personalized product recommendations and have upgraded to the Enterprise plan for SSO and advanced analytics.</p>
        `,
    coverImage:
      "https://images.unsplash.com/photo-1582005450386-52b25f82d9bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3RhcnR1cCUyMHRlYW0lMjBtZWV0aW5nfGVufDF8fHx8MTc3MTcxNTM2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "case-study",
    tags: ["case-study", "scaling", "ecommerce"],
    author: AUTHORS.sarah,
    date: "Feb 8, 2026",
    readTime: "9 min read",
    pinnedProductIds: ["srv-web", "srv-cloud"],
    comments: [
      {
        id: "c5",
        author: "Tom Chen",
        avatar: "",
        date: "Feb 9, 2026",
        text: "Incredible results. We're a similar-sized team and this gives us hope we can ship faster.",
        likes: 14,
      },
      {
        id: "c6",
        author: "Ava Mitchell",
        avatar: "",
        date: "Feb 10, 2026",
        text: "Would love to see more case studies like this — especially for B2B SaaS use cases.",
        likes: 9,
      },
      {
        id: "c7",
        author: "Ryan Park",
        avatar: "",
        date: "Feb 11, 2026",
        text: "The zero custom backend claim is impressive. How did they handle custom business logic?",
        likes: 6,
        replies: [
          {
            id: "c7r1",
            author: "Sarah Kim",
            avatar: AUTHORS.sarah.avatar,
            date: "Feb 11, 2026",
            text: "They used our webhook system and serverless functions for custom logic. The core CRUD and relations are all handled by the platform.",
            likes: 11,
          },
        ],
      },
    ],
  },
  {
    id: "art-4",
    slug: "getting-started",
    title: "Getting Started: From Zero to Your First Module",
    excerpt:
      "Step-by-step guide to setting up your first project, configuring a module, and creating your first entity records in under 10 minutes.",
    content: `
<p>Getting started with the platform is straightforward. This guide walks you through the entire process — from creating your first project to managing entity records in the admin panel.</p>

<h2>Step 1: Create a Project</h2>
<p>Sign up and create your first project from the dashboard. Give it a name and slug, and you'll be dropped into the admin panel immediately.</p>

<h2>Step 2: Choose Your Modules</h2>
<p>The platform comes with 15 modules out of the box. For this tutorial, we'll start with <strong>Ecommerce</strong> and <strong>Blog</strong> — two of the most commonly used modules.</p>

<h2>Step 3: Create Your First Records</h2>
<p>Navigate to the Ecommerce module and click <strong>"Add new"</strong> on the Product model. Fill in the title, slug, short description, and variant. Hit save, and your first product is live.</p>

<h3>Working with Relations</h3>
<p>One of the most powerful features is the relation system. You can link products to articles, attach attributes, and manage these connections through the <strong>Relations</strong> tab on any entity.</p>

<ul>
<li>Open a product and switch to the <strong>Relations</strong> tab</li>
<li>Click <strong>"Add relation"</strong> next to the target model</li>
<li>Select an existing entity or create a new one inline</li>
<li>The join record is created automatically with customizable metadata</li>
</ul>

<h2>Step 4: Preview Your Work</h2>
<p>Every entity card has a <strong>Preview</strong> button that opens a responsive preview dialog. You can switch between viewport sizes (2XL, LG, XS) to see how your content will look across devices.</p>

<p>That's it! You now have a working project with products and articles, connected through relations, and manageable from a single admin panel.</p>
        `,
    coverImage:
      "https://images.unsplash.com/photo-1618410325698-018bb3eb2318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBsYXB0b3AlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzcxNzE1MzY4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "guides",
    tags: ["tutorial", "getting-started", "admin"],
    author: AUTHORS.marcus,
    date: "Feb 3, 2026",
    readTime: "5 min read",
    pinnedProductIds: ["srv-web", "srv-workshop"],
    comments: [
      {
        id: "c8",
        author: "Emily Torres",
        avatar: "",
        date: "Feb 4, 2026",
        text: "Clear and concise. Had my first module running in about 8 minutes.",
        likes: 19,
      },
      {
        id: "c9",
        author: "Josh Kim",
        avatar: "",
        date: "Feb 5, 2026",
        text: "The relations section was especially helpful. Documentation could use more examples like this.",
        likes: 5,
      },
    ],
  },
  {
    id: "art-5",
    slug: "enterprise-security",
    title: "Enterprise Security: How We Protect Your Data",
    excerpt:
      "A deep dive into our enterprise-grade security features, from RBAC and SSO to encryption at rest and audit logging.",
    content: `
<p>Security isn't an afterthought — it's built into every layer of the platform. This article covers our security architecture and the specific features available on the Enterprise plan.</p>

<h2>RBAC: Role-Based Access Control</h2>
<p>The <strong>RBAC module</strong> gives you fine-grained control over who can access what. Define roles, assign permissions, and manage subjects — all from the admin panel.</p>

<p>Each permission is defined by a key (e.g., <code>ecommerce.product.create</code>) and can be assigned to any role. Roles are then assigned to subjects (users), creating a clear chain of authorization.</p>

<h2>Authentication Providers</h2>
<p>We support multiple authentication providers out of the box:</p>
<ul>
<li><strong>Email & Password</strong> — traditional credential-based auth</li>
<li><strong>OAuth (Google)</strong> — single sign-on with Google accounts</li>
<li><strong>Telegram</strong> — instant auth via Telegram bot</li>
</ul>

<h2>Data Encryption</h2>
<p>All data is encrypted at rest using AES-256 and in transit using TLS 1.3. API keys are stored as hashed values and never exposed in plaintext after creation.</p>

<h3>Audit Logging</h3>
<p>Every admin action is logged with the subject ID, timestamp, action type, and affected entity. Audit logs are retained for 90 days on Enterprise plans and can be exported as JSON or CSV.</p>

<blockquote>Security is a continuous process, not a one-time setup. We run penetration tests quarterly and publish the results to Enterprise customers.</blockquote>

<p>If you have specific compliance requirements (SOC 2, GDPR, HIPAA), reach out to our security team for a detailed assessment.</p>
        `,
    coverImage:
      "https://images.unsplash.com/photo-1639503547276-90230c4a4198?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMHNoaWVsZCUyMGRpZ2l0YWwlMjBwcm90ZWN0aW9ufGVufDF8fHx8MTc3MTcxNTg4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "engineering",
    tags: ["security", "rbac", "enterprise"],
    author: AUTHORS.james,
    date: "Jan 28, 2026",
    readTime: "10 min read",
    pinnedProductIds: ["srv-audit", "srv-cloud"],
    comments: [
      {
        id: "c10",
        author: "Victoria Lane",
        avatar: "",
        date: "Jan 29, 2026",
        text: "Do you support SCIM provisioning for enterprise SSO?",
        likes: 3,
        replies: [
          {
            id: "c10r1",
            author: "James Carter",
            avatar: AUTHORS.james.avatar,
            date: "Jan 29, 2026",
            text: "SCIM is on our roadmap for Q3 2026. In the meantime, we support SAML 2.0 for SSO.",
            likes: 5,
          },
        ],
      },
    ],
  },
  {
    id: "art-6",
    slug: "api-integration",
    title: "API Integration Tutorial: Connecting External Services",
    excerpt:
      "Step-by-step guide to integrating with our REST API, setting up webhooks, and building custom automation workflows.",
    content: `
<p>Our REST API gives you full programmatic access to every module in the platform. This tutorial covers authentication, CRUD operations, and webhook configuration.</p>

<h2>Authentication</h2>
<p>All API requests require a Bearer token in the Authorization header. Generate an API key from <strong>Settings &gt; API Keys</strong> in the admin panel.</p>

<pre><code>curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.sps.dev/v1/ecommerce/products</code></pre>

<h2>CRUD Operations</h2>
<p>Every model exposes standard RESTful endpoints:</p>
<ul>
<li><code>GET /v1/{module}/{model}</code> — list records</li>
<li><code>GET /v1/{module}/{model}/{id}</code> — get single record</li>
<li><code>POST /v1/{module}/{model}</code> — create record</li>
<li><code>PATCH /v1/{module}/{model}/{id}</code> — update record</li>
<li><code>DELETE /v1/{module}/{model}/{id}</code> — delete record</li>
</ul>

<h2>Working with Relations</h2>
<p>Relations are managed through join model endpoints. For example, to link a product to an article:</p>

<pre><code>POST /v1/ecommerce/products-to-articles
{
  "productId": "2a167...",
  "articleId": "art-1",
  "orderIndex": 0,
  "variant": "default"
}</code></pre>

<h3>Webhooks</h3>
<p>Configure webhooks from <strong>Settings &gt; Webhooks</strong> to receive real-time notifications when records are created, updated, or deleted. Webhooks support retries, signature verification, and filtering by module/model.</p>

<p>For full API documentation, visit <code>docs.sps.dev/api</code>.</p>
        `,
    coverImage:
      "https://images.unsplash.com/photo-1561347981-969c80cf4463?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSRVNUJTIwQVBJJTIwY29kZSUyMHByb2dyYW1taW5nfGVufDF8fHx8MTc3MTcxNTg4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "engineering",
    tags: ["api", "tutorial", "webhooks"],
    author: AUTHORS.marcus,
    date: "Jan 22, 2026",
    readTime: "11 min read",
    pinnedProductIds: ["srv-api", "srv-cloud"],
    comments: [
      {
        id: "c11",
        author: "Kevin Zhao",
        avatar: "",
        date: "Jan 23, 2026",
        text: "Is there a rate limit on the API? We're planning heavy batch imports.",
        likes: 7,
        replies: [
          {
            id: "c11r1",
            author: "Marcus Webb",
            avatar: AUTHORS.marcus.avatar,
            date: "Jan 23, 2026",
            text: "Free tier is 100 req/min, Startup is 1,000 req/min, Enterprise is custom. For batch imports, we recommend using the bulk endpoint.",
            likes: 10,
          },
        ],
      },
      {
        id: "c12",
        author: "Diana Ross",
        avatar: "",
        date: "Jan 24, 2026",
        text: "The webhook signature verification section was really helpful. Thanks for including the code samples.",
        likes: 4,
      },
      {
        id: "c13",
        author: "Sam Nguyen",
        avatar: "",
        date: "Jan 25, 2026",
        text: "Would be great to see a GraphQL endpoint in the future!",
        likes: 12,
      },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return blogArticles.find((a) => a.slug === slug);
}

export function getProductsForArticle(article: BlogArticle): BlogProduct[] {
  return article.pinnedProductIds
    .map((pid) => blogProducts.find((p) => p.id === pid))
    .filter(Boolean) as BlogProduct[];
}

export function getArticlesByCategory(category: string): BlogArticle[] {
  if (category === "all") return blogArticles;
  return blogArticles.filter((a) => a.category === category);
}

/* ── Author helpers ──────────────────────────────────────────────────── */

export const blogAuthors: BlogAuthor[] = Object.values(AUTHORS);

export function getAuthorBySlug(slug: string): BlogAuthor | undefined {
  return blogAuthors.find((a) => a.slug === slug);
}

export function getArticlesByAuthor(authorSlug: string): BlogArticle[] {
  return blogArticles.filter((a) => a.author.slug === authorSlug);
}
