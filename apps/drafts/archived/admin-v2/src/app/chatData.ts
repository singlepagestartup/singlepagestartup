/* ─── Chat mock data ─────────────────────────────────────────────────── */

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
}

export interface ChatThread {
  id: string;
  title: string;
  createdBy: string;
  createdAt: string;
  lastActivity: string;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  threads: ChatThread[];
  memberIds: string[];
}

/* ── Users ───────────────────────────────────────────────────────────── */

export const chatUsers: ChatUser[] = [
  {
    id: "u1",
    name: "Sarah Kim",
    avatar:
      "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    role: "Head of Product",
    online: true,
  },
  {
    id: "u2",
    name: "James Carter",
    avatar:
      "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    role: "CTO",
    online: true,
  },
  {
    id: "u3",
    name: "Marcus Webb",
    avatar:
      "https://images.unsplash.com/photo-1632670535530-aaf6e90042ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    role: "Lead Engineer",
    online: false,
  },
  {
    id: "u4",
    name: "Elena Torres",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    role: "Designer",
    online: true,
  },
  {
    id: "u5",
    name: "David Lin",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    role: "Marketing Lead",
    online: false,
  },
];

export function getUserById(id: string): ChatUser {
  return chatUsers.find((u) => u.id === id) ?? chatUsers[0];
}

/* ── Groups & Threads ────────────────────────────────────────────────── */

export const chatGroups: ChatGroup[] = [
  {
    id: "g1",
    name: "General",
    description: "Company-wide announcements and discussions",
    icon: "💬",
    memberIds: ["u1", "u2", "u3", "u4", "u5"],
    threads: [
      {
        id: "t1",
        title: "Q1 Goals & OKRs",
        createdBy: "u2",
        createdAt: "2026-01-15T09:00:00Z",
        lastActivity: "2026-02-20T14:30:00Z",
        pinned: true,
        messages: [
          {
            id: "m1",
            userId: "u2",
            text: "Hey team! Let's align on our Q1 goals. I've drafted the OKRs based on last quarter's retro. Main focus areas: platform stability, user growth, and new integrations.",
            timestamp: "2026-01-15T09:00:00Z",
          },
          {
            id: "m2",
            userId: "u1",
            text: 'Looks great, James. For the product side, I\'d add "reduce onboarding friction by 40%". We have solid data from the surveys.',
            timestamp: "2026-01-15T09:15:00Z",
          },
          {
            id: "m3",
            userId: "u3",
            text: "From engineering — we should also prioritize the API v2 migration. It's been on the backlog for 2 quarters now.",
            timestamp: "2026-01-15T09:30:00Z",
          },
          {
            id: "m4",
            userId: "u4",
            text: "I'll prepare updated design specs for the onboarding flow this week. Also, should we revisit the dashboard layout?",
            timestamp: "2026-01-15T10:00:00Z",
          },
          {
            id: "m5",
            userId: "u5",
            text: "Marketing-wise, we are planning the launch campaign for February. Would be great to sync on feature highlights.",
            timestamp: "2026-01-15T10:20:00Z",
          },
          {
            id: "m6",
            userId: "u2",
            text: "Great inputs everyone. Let's schedule a sync for Thursday to finalize. I'll send the calendar invite.",
            timestamp: "2026-01-15T11:00:00Z",
            reactions: [{ emoji: "👍", count: 4 }],
          },
          {
            id: "m6a",
            userId: "u1",
            text: "Thursday works for me. I'll prep a slide deck with the product OKR breakdown so we can review it during the call.",
            timestamp: "2026-01-16T09:00:00Z",
          },
          {
            id: "m6b",
            userId: "u3",
            text: "I've started drafting the API v2 migration timeline. Rough estimate: 6 weeks for core endpoints, 2 more for edge cases and deprecation notices.",
            timestamp: "2026-01-16T09:20:00Z",
          },
          {
            id: "m6c",
            userId: "u4",
            text: "Just shared the onboarding mockups in Figma. Three variants — minimal, guided wizard, and interactive tour. Would love feedback before Thursday.",
            timestamp: "2026-01-16T10:00:00Z",
            reactions: [{ emoji: "🎨", count: 2 }],
          },
          {
            id: "m6d",
            userId: "u5",
            text: "The February campaign timeline is ready. Key dates: soft launch Jan 27, press outreach Feb 3, public launch Feb 10. Need eng to confirm feature freeze date.",
            timestamp: "2026-01-16T10:30:00Z",
          },
          {
            id: "m6e",
            userId: "u2",
            text: "Feature freeze: Feb 5. That gives marketing 5 days to prep final assets. Marcus, can the API migration wait until after launch?",
            timestamp: "2026-01-16T11:00:00Z",
          },
          {
            id: "m6f",
            userId: "u3",
            text: "Yes, we can start API v2 post-launch. I'll focus on stability fixes and performance optimization until then. Already identified 3 slow queries in the dashboard.",
            timestamp: "2026-01-16T11:15:00Z",
          },
          {
            id: "m6g",
            userId: "u1",
            text: "Perfect. Here's my updated priority list:\n1. Onboarding flow redesign (Elena)\n2. Performance fixes (Marcus)\n3. Launch campaign support (David)\n4. API v2 planning (post-launch)\n\nDoes this align with everyone?",
            timestamp: "2026-01-16T14:00:00Z",
          },
          {
            id: "m6h",
            userId: "u4",
            text: "Aligned from design side. I'll also squeeze in the dark mode color tokens since they're 80% done already.",
            timestamp: "2026-01-16T14:20:00Z",
          },
          {
            id: "m6i",
            userId: "u3",
            text: "Quick update: fixed 2 of the 3 slow queries. Dashboard load time went from 3.2s to 1.1s. The third one needs a schema change — will discuss Thursday.",
            timestamp: "2026-01-17T09:00:00Z",
            reactions: [{ emoji: "⚡", count: 3 }],
          },
          {
            id: "m6j",
            userId: "u2",
            text: "Incredible improvement, Marcus! That's going to make a big difference for the launch. Let's make sure we have benchmarks documented.",
            timestamp: "2026-01-17T09:30:00Z",
          },
          {
            id: "m6k",
            userId: "u5",
            text: "Just got confirmation from TechCrunch — they're interested in covering our launch! Need a press kit by Feb 1. Sarah, can you help with the product narrative?",
            timestamp: "2026-01-17T10:00:00Z",
            reactions: [{ emoji: "🔥", count: 4 }],
          },
          {
            id: "m6l",
            userId: "u1",
            text: "Absolutely! I'll draft the product story this weekend. We should highlight the performance improvements too — '3x faster dashboard' is a great headline.",
            timestamp: "2026-01-17T10:15:00Z",
          },
          {
            id: "m6m",
            userId: "u4",
            text: "I can create visual assets for the press kit — before/after screenshots, product shots, and a short animation of the new onboarding flow.",
            timestamp: "2026-01-17T10:30:00Z",
          },
          {
            id: "m6n",
            userId: "u2",
            text: "This is coming together beautifully. Thursday's sync agenda:\n1. OKR review (Sarah)\n2. Eng timeline & schema discussion (Marcus)\n3. Design review (Elena)\n4. Launch checklist (David)\n\nMeeting invite sent!",
            timestamp: "2026-01-17T11:00:00Z",
            reactions: [{ emoji: "👍", count: 5 }],
          },
          {
            id: "m6o",
            userId: "u3",
            text: "Thursday sync was productive! Posting summary:\n- OKRs approved with minor tweaks\n- Schema migration approved for Saturday maintenance window\n- Onboarding variant B (guided wizard) chosen\n- Press kit deadline confirmed: Feb 1",
            timestamp: "2026-01-18T16:00:00Z",
          },
          {
            id: "m6p",
            userId: "u1",
            text: "Great summary. One addition: we agreed to add a feedback widget to the new onboarding flow so we can measure satisfaction from day one.",
            timestamp: "2026-01-18T16:15:00Z",
          },
          {
            id: "m6q",
            userId: "u5",
            text: "Press kit draft is live in the shared drive. Please review by Monday — especially the product screenshots, I want to make sure they show the latest UI.",
            timestamp: "2026-01-19T09:00:00Z",
          },
          {
            id: "m6r",
            userId: "u4",
            text: "Reviewed the press kit — screenshots need updating. I'll swap them with the new onboarding wizard shots today.",
            timestamp: "2026-01-19T10:00:00Z",
          },
          {
            id: "m6s",
            userId: "u3",
            text: "Schema migration completed successfully! Zero downtime. All 847 test cases passing. We're in great shape for launch.",
            timestamp: "2026-01-20T08:00:00Z",
            reactions: [{ emoji: "🎉", count: 5 }],
          },
          {
            id: "m6t",
            userId: "u2",
            text: "Excellent work this week, everyone. We're on track and ahead of schedule. Let's keep the momentum going!",
            timestamp: "2026-01-20T09:00:00Z",
            reactions: [{ emoji: "🚀", count: 4 }],
          },
        ],
      },
      {
        id: "t2",
        title: "Office Wi-Fi Issues",
        createdBy: "u3",
        createdAt: "2026-02-18T11:00:00Z",
        lastActivity: "2026-02-19T09:00:00Z",
        messages: [
          {
            id: "m7",
            userId: "u3",
            text: "Anyone else experiencing slow Wi-Fi on the 3rd floor today? My connection keeps dropping.",
            timestamp: "2026-02-18T11:00:00Z",
          },
          {
            id: "m8",
            userId: "u4",
            text: "Yes! Been like this since morning. Had to switch to mobile hotspot for the design review call.",
            timestamp: "2026-02-18T11:10:00Z",
          },
          {
            id: "m9",
            userId: "u2",
            text: "I've contacted IT. They're aware and working on it — apparently a firmware update went wrong on one of the APs.",
            timestamp: "2026-02-18T11:30:00Z",
            reactions: [{ emoji: "🙏", count: 3 }],
          },
          {
            id: "m10",
            userId: "u3",
            text: "Seems to be fixed now. Thanks James!",
            timestamp: "2026-02-19T09:00:00Z",
          },
        ],
      },
      {
        id: "t3",
        title: "Team Lunch Friday",
        createdBy: "u5",
        createdAt: "2026-02-19T15:00:00Z",
        lastActivity: "2026-02-21T10:00:00Z",
        messages: [
          {
            id: "m11",
            userId: "u5",
            text: "Hey folks! Planning a team lunch for this Friday. Any dietary restrictions or restaurant preferences? I'm thinking Thai or Italian.",
            timestamp: "2026-02-19T15:00:00Z",
          },
          {
            id: "m12",
            userId: "u1",
            text: "Thai sounds amazing! I'm in. No restrictions on my end.",
            timestamp: "2026-02-19T15:20:00Z",
            reactions: [{ emoji: "🍜", count: 2 }],
          },
          {
            id: "m13",
            userId: "u4",
            text: "I'm vegetarian, so as long as there are options, I'm happy with either!",
            timestamp: "2026-02-19T15:35:00Z",
          },
          {
            id: "m14",
            userId: "u3",
            text: "+1 for Thai. Pad See Ew is calling my name 😄",
            timestamp: "2026-02-20T09:00:00Z",
          },
          {
            id: "m15",
            userId: "u5",
            text: "Thai it is! Booked a table at Siam Garden for 12:30. See everyone there!",
            timestamp: "2026-02-21T10:00:00Z",
            reactions: [{ emoji: "🎉", count: 5 }],
          },
        ],
      },
    ],
  },
  {
    id: "g2",
    name: "Engineering",
    description: "Technical discussions, code reviews, and architecture",
    icon: "⚙️",
    memberIds: ["u2", "u3"],
    threads: [
      {
        id: "t4",
        title: "Database Migration Plan",
        createdBy: "u3",
        createdAt: "2026-02-10T10:00:00Z",
        lastActivity: "2026-02-22T08:00:00Z",
        pinned: true,
        messages: [
          {
            id: "m16",
            userId: "u3",
            text: "We need to migrate from Postgres 14 to 16. Here's my proposed plan:\n\n1. Set up read replica on PG16\n2. Run parallel writes for 1 week\n3. Validate data integrity\n4. Switch over during maintenance window\n\nThoughts?",
            timestamp: "2026-02-10T10:00:00Z",
          },
          {
            id: "m17",
            userId: "u2",
            text: "Solid plan. A few considerations:\n- We should also benchmark query performance on the replica\n- Need to check for deprecated extensions\n- Let's add rollback steps for each phase",
            timestamp: "2026-02-10T10:30:00Z",
          },
          {
            id: "m18",
            userId: "u3",
            text: "Good call on the benchmarks. I'll set up pgbench comparisons. For extensions, I've already checked — we only use pg_trgm and uuid-ossp, both fine on 16.",
            timestamp: "2026-02-10T11:00:00Z",
          },
          {
            id: "m19",
            userId: "u2",
            text: "Perfect. Let's aim for the migration window on March 1st. That gives us enough time for testing.",
            timestamp: "2026-02-10T11:15:00Z",
            reactions: [{ emoji: "✅", count: 2 }],
          },
          {
            id: "m20",
            userId: "u3",
            text: "Update: benchmarks look great. PG16 is ~15% faster on our heavy aggregation queries. Proceeding with replica setup today.",
            timestamp: "2026-02-22T08:00:00Z",
          },
        ],
      },
      {
        id: "t5",
        title: "Code Review: Auth Refactor PR #287",
        createdBy: "u2",
        createdAt: "2026-02-20T14:00:00Z",
        lastActivity: "2026-02-21T16:00:00Z",
        messages: [
          {
            id: "m21",
            userId: "u2",
            text: "Opened PR #287 for the auth refactor. Key changes:\n- Moved from session-based to JWT\n- Added refresh token rotation\n- New middleware for role-based access\n\nNeed your review, Marcus.",
            timestamp: "2026-02-20T14:00:00Z",
          },
          {
            id: "m22",
            userId: "u3",
            text: "Looking at it now. Initial thoughts:\n- The token expiry of 15min seems aggressive, maybe 30min?\n- Nice pattern on the middleware composition\n- Found a potential race condition in the refresh endpoint — left a comment on line 142",
            timestamp: "2026-02-20T16:00:00Z",
          },
          {
            id: "m23",
            userId: "u2",
            text: "Good catch on the race condition! Fixed with a mutex lock. Bumped expiry to 30min as suggested. Updated the PR.",
            timestamp: "2026-02-21T10:00:00Z",
          },
          {
            id: "m24",
            userId: "u3",
            text: "LGTM! Approved. Great refactor. 🚀",
            timestamp: "2026-02-21T16:00:00Z",
            reactions: [{ emoji: "🚀", count: 2 }],
          },
        ],
      },
      {
        id: "t6",
        title: "CI/CD Pipeline Optimization",
        createdBy: "u3",
        createdAt: "2026-02-15T09:00:00Z",
        lastActivity: "2026-02-18T11:00:00Z",
        messages: [
          {
            id: "m25",
            userId: "u3",
            text: "Our CI builds are averaging 12 minutes. Target: under 5. Ideas:\n- Parallel test suites\n- Docker layer caching\n- Split e2e from unit tests",
            timestamp: "2026-02-15T09:00:00Z",
          },
          {
            id: "m26",
            userId: "u2",
            text: "Agreed. Also consider:\n- nx-affected for monorepo — only test changed packages\n- Remote caching for dependencies",
            timestamp: "2026-02-15T09:30:00Z",
          },
          {
            id: "m27",
            userId: "u3",
            text: "Implemented parallel tests + Docker caching. Down to 6.5 min already! Working on the nx-affected setup next.",
            timestamp: "2026-02-18T11:00:00Z",
            reactions: [{ emoji: "⚡", count: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: "g3",
    name: "Design",
    description: "Design reviews, UI/UX research, and creative discussions",
    icon: "🎨",
    memberIds: ["u1", "u4"],
    threads: [
      {
        id: "t7",
        title: "New Dashboard Layout Concepts",
        createdBy: "u4",
        createdAt: "2026-02-12T10:00:00Z",
        lastActivity: "2026-02-20T15:00:00Z",
        pinned: true,
        messages: [
          {
            id: "m28",
            userId: "u4",
            text: "I've put together 3 layout concepts for the new dashboard. The key insight from user research: people want glanceable metrics, not deep tables.\n\nConcept A: Card grid with sparklines\nConcept B: Kanban-style columns\nConcept C: Single-scroll with sections\n\nI'll share the Figma link shortly.",
            timestamp: "2026-02-12T10:00:00Z",
          },
          {
            id: "m29",
            userId: "u1",
            text: "Love the direction! Concept A resonates most with our user persona research. The sparklines give immediate trend visibility without clicks.",
            timestamp: "2026-02-12T10:30:00Z",
          },
          {
            id: "m30",
            userId: "u4",
            text: "Agreed. I'll refine Concept A with responsive breakpoints. Also adding a customizable widget system so power users can rearrange.",
            timestamp: "2026-02-12T11:00:00Z",
          },
          {
            id: "m31",
            userId: "u1",
            text: "The refined version looks fantastic, Elena! Small feedback: the color coding for status indicators could use more contrast for accessibility. Otherwise, ready for eng handoff.",
            timestamp: "2026-02-20T15:00:00Z",
            reactions: [{ emoji: "🎨", count: 2 }],
          },
        ],
      },
      {
        id: "t8",
        title: "Design System v2.0 Updates",
        createdBy: "u4",
        createdAt: "2026-02-17T09:00:00Z",
        lastActivity: "2026-02-21T14:00:00Z",
        messages: [
          {
            id: "m32",
            userId: "u4",
            text: "Working on Design System v2.0. Major updates:\n- New spacing scale (4px base)\n- Updated color palette with better a11y scores\n- Component variants for compact/comfortable/spacious density\n- Dark mode tokens finalized",
            timestamp: "2026-02-17T09:00:00Z",
          },
          {
            id: "m33",
            userId: "u1",
            text: "This is huge. The density variants will solve so many complaints about the admin panel being too spacious on smaller screens.",
            timestamp: "2026-02-17T09:30:00Z",
          },
          {
            id: "m34",
            userId: "u4",
            text: "Exactly! Also added new motion tokens — consistent easing curves and durations. The system is published in Figma if you want to preview.",
            timestamp: "2026-02-21T14:00:00Z",
            reactions: [{ emoji: "✨", count: 3 }],
          },
        ],
      },
    ],
  },
  {
    id: "g4",
    name: "Marketing",
    description: "Campaigns, content strategy, and growth metrics",
    icon: "📢",
    memberIds: ["u1", "u5"],
    threads: [
      {
        id: "t9",
        title: "February Launch Campaign",
        createdBy: "u5",
        createdAt: "2026-02-01T09:00:00Z",
        lastActivity: "2026-02-22T09:00:00Z",
        pinned: true,
        messages: [
          {
            id: "m35",
            userId: "u5",
            text: "Campaign plan for the February product launch:\n- Blog series: 3 posts leading up to launch\n- Social media blitz: Twitter, LinkedIn, ProductHunt\n- Email campaign: 3-touch sequence\n- Webinar on launch day\n\nBudget: $5K for paid ads",
            timestamp: "2026-02-01T09:00:00Z",
          },
          {
            id: "m36",
            userId: "u1",
            text: "Love the plan, David. Can we add a customer spotlight? I have 3 beta users willing to share their experience.",
            timestamp: "2026-02-01T09:30:00Z",
          },
          {
            id: "m37",
            userId: "u5",
            text: "Brilliant idea! I'll reach out to them for short video testimonials. Also, should we do a pre-launch landing page with an early access waitlist?",
            timestamp: "2026-02-01T10:00:00Z",
          },
          {
            id: "m38",
            userId: "u1",
            text: "Yes! That worked great for our last launch. We got 2,400 signups from the waitlist alone.",
            timestamp: "2026-02-01T10:15:00Z",
            reactions: [{ emoji: "🔥", count: 2 }],
          },
          {
            id: "m39",
            userId: "u5",
            text: "Update: Landing page is live! Already at 800 signups after 48 hours. The Twitter thread announcing it got 45K impressions.",
            timestamp: "2026-02-22T09:00:00Z",
            reactions: [{ emoji: "🚀", count: 3 }],
          },
        ],
      },
      {
        id: "t10",
        title: "Content Calendar — March",
        createdBy: "u5",
        createdAt: "2026-02-19T14:00:00Z",
        lastActivity: "2026-02-21T11:00:00Z",
        messages: [
          {
            id: "m40",
            userId: "u5",
            text: "Drafting the March content calendar. Themes:\n\nWeek 1: Post-launch case studies\nWeek 2: Technical deep-dives (collab with eng)\nWeek 3: User tips & tricks series\nWeek 4: Community spotlight\n\nWho can contribute?",
            timestamp: "2026-02-19T14:00:00Z",
          },
          {
            id: "m41",
            userId: "u1",
            text: "I can write the Week 1 case studies. I have great data from the beta program. Also, for Week 3 — let's get short clips from users.",
            timestamp: "2026-02-19T14:30:00Z",
          },
          {
            id: "m42",
            userId: "u5",
            text: "Perfect! I'll coordinate with James and Marcus for the Week 2 technical posts. Let's finalize by next Wednesday.",
            timestamp: "2026-02-21T11:00:00Z",
          },
        ],
      },
    ],
  },
  {
    id: "g5",
    name: "Random",
    description: "Off-topic conversations, memes, and fun stuff",
    icon: "🎲",
    memberIds: ["u1", "u2", "u3", "u4", "u5"],
    threads: [
      {
        id: "t11",
        title: "Best IDE Setup 2026?",
        createdBy: "u3",
        createdAt: "2026-02-16T12:00:00Z",
        lastActivity: "2026-02-20T16:00:00Z",
        messages: [
          {
            id: "m43",
            userId: "u3",
            text: "Hot take: Cursor has replaced VS Code for me entirely. The AI-assist features are just too good. Anyone else made the switch?",
            timestamp: "2026-02-16T12:00:00Z",
          },
          {
            id: "m44",
            userId: "u2",
            text: "I'm still on Neovim with a heavily customized config. Old habits die hard 😅 But I have to admit, the AI integrations in modern editors are tempting.",
            timestamp: "2026-02-16T12:15:00Z",
          },
          {
            id: "m45",
            userId: "u4",
            text: "For design-to-code, I love the new Figma Dev Mode → editor bridge. Makes my workflow so much smoother.",
            timestamp: "2026-02-16T12:30:00Z",
          },
          {
            id: "m46",
            userId: "u1",
            text: "I'm still a VS Code person with GitHub Copilot. It just works for my product spec writing too.",
            timestamp: "2026-02-16T13:00:00Z",
          },
          {
            id: "m47",
            userId: "u3",
            text: "Fair points all around. The best IDE is the one you're productive in! 🤓",
            timestamp: "2026-02-20T16:00:00Z",
            reactions: [{ emoji: "💯", count: 4 }],
          },
        ],
      },
      {
        id: "t12",
        title: "Coffee Machine Emergency",
        createdBy: "u1",
        createdAt: "2026-02-21T08:30:00Z",
        lastActivity: "2026-02-21T10:00:00Z",
        messages: [
          {
            id: "m48",
            userId: "u1",
            text: "🚨 The coffee machine on the 2nd floor is broken. This is a CODE RED situation.",
            timestamp: "2026-02-21T08:30:00Z",
            reactions: [{ emoji: "😱", count: 5 }],
          },
          {
            id: "m49",
            userId: "u3",
            text: "Not the coffee machine! I can't function without my morning espresso.",
            timestamp: "2026-02-21T08:35:00Z",
          },
          {
            id: "m50",
            userId: "u2",
            text: "I've escalated to facilities. ETA for repair: 2 hours. In the meantime, 4th floor machine is working.",
            timestamp: "2026-02-21T08:45:00Z",
          },
          {
            id: "m51",
            userId: "u4",
            text: "Crisis averted. 4th floor coffee acquired. ☕",
            timestamp: "2026-02-21T09:00:00Z",
            reactions: [{ emoji: "☕", count: 3 }],
          },
          {
            id: "m52",
            userId: "u5",
            text: "The real question is: who keeps using the machine without refilling the beans? 👀",
            timestamp: "2026-02-21T10:00:00Z",
            reactions: [{ emoji: "👀", count: 4 }],
          },
        ],
      },
    ],
  },
];
