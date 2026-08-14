import { v4 as uuidv4 } from "uuid";

// Types
export interface Module {
  id: string;
  name: string;
  slug: string;
  icon: string;
  models: Model[];
}

export interface Model {
  id: string;
  name: string;
  slug: string;
  fields: Field[];
  relations?: Relation[];
}

export interface Field {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "boolean"
    | "datetime"
    | "richtext"
    | "localized-text";
  readonly?: boolean;
}

export interface Relation {
  targetModelSlug: string;
  targetModuleSlug: string;
  joinModelSlug: string;
  label: string;
}

export interface Record {
  id: string;
  [key: string]: any;
}

export interface AccountSubject {
  id: string;
  slug: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountIdentity {
  id: string;
  provider: string;
  email: string;
  account: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectToIdentity {
  id: string;
  subjectId: string;
  identityId: string;
  orderIndex: number;
  variant: string;
  className: string;
}

export interface AccountSocialProfile {
  id: string;
  adminTitle: string;
  title: { en: string; ru: string };
  subtitle: { en: string; ru: string };
  description: { en: string; ru: string };
  slug: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectToSocialProfile {
  id: string;
  subjectId: string;
  socialModuleProfileId: string;
  orderIndex: number;
  variant: string;
  className: string;
}

export interface SettingsOperationConfig {
  endpoint: string;
  method: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
}

// Minimal fields for models that don't have detailed definitions
const minimalFields: Field[] = [
  { name: "id", label: "ID", type: "text", readonly: true },
  { name: "adminTitle", label: "Admin Title", type: "text" },
  { name: "title", label: "Title", type: "localized-text" },
  { name: "slug", label: "Slug", type: "text" },
  {
    name: "shortDescription",
    label: "Short Description",
    type: "localized-text",
  },
];

function makeModel(
  id: string,
  name: string,
  slug: string,
  fields?: Field[],
  relations?: Relation[],
): Model {
  return {
    id,
    name,
    slug,
    fields: fields || minimalFields,
    relations,
  };
}

// Mock Schema - All 15 modules
export const schema: Module[] = [
  {
    id: "mod-website",
    name: "Website Builder",
    slug: "website-builder",
    icon: "🏗️",
    models: [
      makeModel("ws-button", "Button", "button"),
      makeModel("ws-buttons-array", "Buttons Array", "buttons-array"),
      makeModel("ws-feature", "Feature", "feature"),
      makeModel("ws-logotype", "Logotype", "logotype"),
      makeModel("ws-slide", "Slide", "slide"),
      makeModel("ws-slider", "Slider", "slider"),
      makeModel("ws-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-ecommerce",
    name: "Ecommerce",
    slug: "ecommerce",
    icon: "🛍️",
    models: [
      {
        id: "model-attribute",
        name: "Attribute",
        slug: "attribute",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "adminTitle", label: "Admin Title", type: "text" },
          { name: "title", label: "Title", type: "localized-text" },
          { name: "key", label: "Key", type: "text" },
          { name: "value", label: "Value", type: "text" },
          {
            name: "shortDescription",
            label: "Short Description",
            type: "localized-text",
          },
        ],
      },
      makeModel("model-attribute-key", "Attribute Key", "attribute-key"),
      {
        id: "model-category",
        name: "Category",
        slug: "category",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "adminTitle", label: "Admin Title", type: "text" },
          { name: "slug", label: "Slug", type: "text" },
        ],
      },
      {
        id: "model-order",
        name: "Order",
        slug: "order",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "customerName", label: "Customer Name", type: "text" },
          { name: "total", label: "Total", type: "number" },
          { name: "status", label: "Status", type: "text" },
        ],
        relations: [
          {
            targetModuleSlug: "ecommerce",
            targetModelSlug: "product",
            joinModelSlug: "orders-to-products",
            label: "Ordered Products",
          },
        ],
      },
      {
        id: "model-product",
        name: "Product",
        slug: "product",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "adminTitle", label: "Admin Title", type: "text" },
          { name: "title", label: "Title", type: "localized-text" },
          { name: "slug", label: "Slug", type: "text" },
          { name: "type", label: "Type", type: "text" },
          { name: "variant", label: "Variant", type: "text" },
          {
            name: "shortDescription",
            label: "Short Description",
            type: "localized-text",
          },
        ],
        relations: [
          {
            targetModuleSlug: "ecommerce",
            targetModelSlug: "attribute",
            joinModelSlug: "products-to-attributes",
            label: "Attributes",
          },
          {
            targetModuleSlug: "blog",
            targetModelSlug: "article",
            joinModelSlug: "products-to-articles",
            label: "Articles",
          },
        ],
      },
      {
        id: "model-store",
        name: "Store",
        slug: "store",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "adminTitle", label: "Admin Title", type: "text" },
          { name: "slug", label: "Slug", type: "text" },
        ],
      },
      makeModel("ec-widget", "Widget", "widget"),
      // Join Models as First-Class Citizens
      {
        id: "join-products-to-articles",
        name: "Products to Articles",
        slug: "products-to-articles",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "productId", label: "Product ID", type: "text" },
          { name: "articleId", label: "Article ID", type: "text" },
          { name: "orderIndex", label: "Order Index", type: "number" },
          { name: "variant", label: "Variant", type: "text" },
        ],
      },
      {
        id: "join-products-to-attributes",
        name: "Products to Attributes",
        slug: "products-to-attributes",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "productId", label: "Product ID", type: "text" },
          { name: "attributeId", label: "Attribute ID", type: "text" },
          { name: "orderIndex", label: "Order Index", type: "number" },
          { name: "variant", label: "Variant", type: "text" },
          { name: "className", label: "Class Name", type: "text" },
        ],
      },
      {
        id: "join-orders-to-products",
        name: "Orders to Products",
        slug: "orders-to-products",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "orderId", label: "Order ID", type: "text" },
          { name: "productId", label: "Product ID", type: "text" },
          { name: "quantity", label: "Quantity", type: "number" },
        ],
      },
    ],
  },
  {
    id: "mod-billing",
    name: "Billing",
    slug: "billing",
    icon: "💳",
    models: [
      makeModel("bill-currency", "Currency", "currency"),
      {
        id: "model-invoice",
        name: "Invoice",
        slug: "invoice",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "amount", label: "Amount", type: "number" },
          { name: "date", label: "Date", type: "datetime" },
        ],
      },
      makeModel("bill-payment-intent", "Payment Intent", "payment-intent"),
      makeModel("bill-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-blog",
    name: "Blog",
    slug: "blog",
    icon: "📝",
    models: [
      {
        id: "model-article",
        name: "Article",
        slug: "article",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "adminTitle", label: "Admin Title", type: "text" },
          { name: "title", label: "Title", type: "localized-text" },
          { name: "slug", label: "Slug", type: "text" },
          { name: "content", label: "Content", type: "richtext" },
        ],
      },
      makeModel("blog-category", "Category", "category"),
      makeModel("blog-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-crm",
    name: "CRM",
    slug: "crm",
    icon: "📋",
    models: [
      makeModel("crm-form", "Form", "form"),
      makeModel("crm-input", "Input", "input"),
      makeModel("crm-option", "Option", "option"),
      makeModel("crm-request", "Request", "request"),
      makeModel("crm-step", "Step", "step"),
      makeModel("crm-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-social",
    name: "Social",
    slug: "social",
    icon: "💬",
    models: [
      makeModel("social-action", "Action", "action"),
      makeModel("social-attribute", "Attribute", "attribute"),
      makeModel("social-attribute-key", "Attribute Key", "attribute-key"),
      makeModel("social-chat", "Chat", "chat"),
      makeModel("social-message", "Message", "message"),
      makeModel("social-profile", "Profile", "profile"),
      makeModel("social-thread", "Thread", "thread"),
      makeModel("social-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-notification",
    name: "Notification",
    slug: "notification",
    icon: "🔔",
    models: [
      makeModel("notif-notification", "Notification", "notification"),
      makeModel("notif-template", "Template", "template"),
      makeModel("notif-topic", "Topic", "topic"),
      makeModel("notif-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-file-storage",
    name: "File Storage",
    slug: "file-storage",
    icon: "🗂️",
    models: [
      makeModel("fs-file", "File", "file"),
      makeModel("fs-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-agent",
    name: "Agent",
    slug: "agent",
    icon: "🤖",
    models: [
      makeModel("agent-agent", "Agent", "agent"),
      makeModel("agent-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-broadcast",
    name: "Broadcast",
    slug: "broadcast",
    icon: "📡",
    models: [
      makeModel("broadcast-channel", "Channel", "channel"),
      makeModel("broadcast-message", "Message", "message"),
    ],
  },
  {
    id: "mod-analytic",
    name: "Analytic",
    slug: "analytic",
    icon: "📈",
    models: [
      makeModel("analytic-metric", "Metric", "metric"),
      makeModel("analytic-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-telegram",
    name: "Telegram",
    slug: "telegram",
    icon: "✈️",
    models: [
      makeModel("telegram-page", "Page", "page"),
      makeModel("telegram-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-startup",
    name: "Startup",
    slug: "startup",
    icon: "🚀",
    models: [makeModel("startup-widget", "Widget", "widget")],
  },
  {
    id: "mod-host",
    name: "Host",
    slug: "host",
    icon: "🧩",
    models: [
      makeModel("host-layout", "Layout", "layout"),
      makeModel("host-metadata", "Metadata", "metadata"),
      makeModel("host-page", "Page", "page"),
      makeModel("host-widget", "Widget", "widget"),
    ],
  },
  {
    id: "mod-rbac",
    name: "RBAC",
    slug: "rbac",
    icon: "🔐",
    models: [
      makeModel("rbac-action", "Action", "action"),
      makeModel("rbac-identity", "Identity", "identity"),
      {
        id: "model-permission",
        name: "Permission",
        slug: "permission",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "key", label: "Key", type: "text" },
        ],
      },
      {
        id: "model-role",
        name: "Role",
        slug: "role",
        fields: [
          { name: "id", label: "ID", type: "text", readonly: true },
          { name: "name", label: "Name", type: "text" },
        ],
      },
      makeModel("rbac-subject", "Subject", "subject"),
      makeModel("rbac-widget", "Widget", "widget"),
    ],
  },
];

// Mock Data Store
const mockRecords: Record<string, Record[]> = {
  product: [
    {
      id: "2a167247-3770-4365-8b8a-19935ab2b15f",
      adminTitle: "Free Subscription",
      title: { en: "Free Tier", ru: "Бесплатный" },
      slug: "free-subscription",
      type: "subscription",
      variant: "default",
      shortDescription: {
        en: "Free subscription with limited features",
        ru: "Бесплатная подписка",
      },
    },
    {
      id: "6f43f39d-5f5d-4ef6-91a4-f95ec01b4f11",
      adminTitle: "Enterprise Suite",
      title: { en: "Enterprise", ru: "Энтерпрайз" },
      slug: "enterprise",
      type: "subscription",
      variant: "default",
      shortDescription: {
        en: "Advanced package for large teams",
        ru: "Расширенный пакет",
      },
    },
    {
      id: "bb2473b0-9b2e-4dd2-bd32-f29f7a4d0b3b",
      adminTitle: "Startup",
      title: { en: "Startup Plan", ru: "Стартовый план" },
      slug: "startup",
      type: "product",
      variant: "default",
      shortDescription: { en: "Perfect for startups", ru: "Для стартапов" },
    },
    {
      id: "e13709ae-58ea-416f-b6d5-d2802c9f5bce",
      adminTitle: "product-e13709ae-58ea-416f-b6d5-d2802c9f5bce",
      title: { en: "Website", ru: "Веб-сайт" },
      slug: "website",
      type: "product",
      variant: "default",
      shortDescription: {
        en: "Professional website builder",
        ru: "Профессиональный конструктор сайтов",
      },
    },
    {
      id: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      adminTitle: "Pro Subscription",
      title: { en: "Pro Subscription", ru: "Подписка Про" },
      slug: "pro",
      type: "subscription",
      variant: "default",
      shortDescription: {
        en: "Pro subscription for getting all the features",
        ru: "Подписка для получения доступа к нейронным сетям",
      },
    },
  ],
  article: [
    {
      id: "art-1",
      adminTitle: "How to choose a plan",
      title: { en: "How to choose a plan", ru: "Как выбрать план" },
      slug: "how-to-choose",
      content:
        "A comprehensive guide to choosing the right subscription plan for your needs.",
    },
    {
      id: "art-2",
      adminTitle: "New Features 2024",
      title: { en: "New Features 2024", ru: "Новые функции 2024" },
      slug: "new-features",
      content: "Exciting new features available in 2024.",
    },
    {
      id: "art-3",
      adminTitle: "Customer Success Story",
      title: { en: "Customer Success Story", ru: "История успеха" },
      slug: "success-story",
      content: "How one company scaled with our platform.",
    },
    {
      id: "art-4",
      adminTitle: "Getting Started Guide",
      title: {
        en: "Getting Started Guide",
        ru: "Руководство по началу работы",
      },
      slug: "getting-started",
      content: "Everything you need to know to get started with the platform.",
    },
    {
      id: "art-5",
      adminTitle: "Enterprise Security Overview",
      title: { en: "Enterprise Security Overview", ru: "Обзор безопасности" },
      slug: "enterprise-security",
      content: "A deep dive into our enterprise-grade security features.",
    },
    {
      id: "art-6",
      adminTitle: "API Integration Tutorial",
      title: {
        en: "API Integration Tutorial",
        ru: "Руководство по интеграции API",
      },
      slug: "api-integration",
      content: "Step-by-step guide to integrating with our REST API.",
    },
  ],
  attribute: [
    {
      id: "7a8a437aae24faeb",
      adminTitle: "Attribute - 7a8a437a",
      title: { en: "Sample Attribute", ru: "Пример Attribute" },
      key: "String",
      value: "Color",
      shortDescription: {
        en: "Auto-generated nested entity preview",
        ru: "Автоматически созданный превью объект",
      },
    },
    {
      id: "attr-2",
      adminTitle: "Attribute - attr-2",
      title: { en: "Number Attribute", ru: "Числовой атрибут" },
      key: "Number",
      value: "0",
      shortDescription: {
        en: "Numeric type attribute",
        ru: "Атрибут числового типа",
      },
    },
  ],
  category: [
    { id: "cat-1", adminTitle: "Electronics", slug: "electronics" },
    { id: "cat-2", adminTitle: "Software", slug: "software" },
  ],
  store: [{ id: "store-1", adminTitle: "Main Store", slug: "main-store" }],
  "products-to-articles": [
    {
      id: "join-1",
      productId: "2a167247-3770-4365-8b8a-19935ab2b15f",
      articleId: "art-1",
      orderIndex: 0,
      variant: "default",
    },
    {
      id: "join-2",
      productId: "2a167247-3770-4365-8b8a-19935ab2b15f",
      articleId: "art-2",
      orderIndex: 1,
      variant: "featured",
    },
    {
      id: "join-pa-3",
      productId: "2a167247-3770-4365-8b8a-19935ab2b15f",
      articleId: "art-4",
      orderIndex: 2,
      variant: "compact",
    },
    {
      id: "join-pa-4",
      productId: "6f43f39d-5f5d-4ef6-91a4-f95ec01b4f11",
      articleId: "art-5",
      orderIndex: 0,
      variant: "default",
    },
    {
      id: "join-pa-5",
      productId: "6f43f39d-5f5d-4ef6-91a4-f95ec01b4f11",
      articleId: "art-3",
      orderIndex: 1,
      variant: "featured",
    },
    {
      id: "join-pa-6",
      productId: "bb2473b0-9b2e-4dd2-bd32-f29f7a4d0b3b",
      articleId: "art-1",
      orderIndex: 0,
      variant: "default",
    },
    {
      id: "join-pa-7",
      productId: "bb2473b0-9b2e-4dd2-bd32-f29f7a4d0b3b",
      articleId: "art-6",
      orderIndex: 1,
      variant: "default",
    },
    {
      id: "join-pa-8",
      productId: "e13709ae-58ea-416f-b6d5-d2802c9f5bce",
      articleId: "art-4",
      orderIndex: 0,
      variant: "default",
    },
    {
      id: "join-pa-9",
      productId: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      articleId: "art-2",
      orderIndex: 0,
      variant: "featured",
    },
    {
      id: "join-pa-10",
      productId: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      articleId: "art-6",
      orderIndex: 1,
      variant: "default",
    },
    {
      id: "join-pa-11",
      productId: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      articleId: "art-3",
      orderIndex: 2,
      variant: "compact",
    },
  ],
  "products-to-attributes": [
    {
      id: "join-3",
      productId: "2a167247-3770-4365-8b8a-19935ab2b15f",
      attributeId: "7a8a437aae24faeb",
      orderIndex: 0,
      variant: "default",
      className: "",
    },
    {
      id: "join-5",
      productId: "2a167247-3770-4365-8b8a-19935ab2b15f",
      attributeId: "attr-2",
      orderIndex: 1,
      variant: "default",
      className: "",
    },
    {
      id: "join-at-3",
      productId: "6f43f39d-5f5d-4ef6-91a4-f95ec01b4f11",
      attributeId: "7a8a437aae24faeb",
      orderIndex: 0,
      variant: "default",
      className: "highlight",
    },
    {
      id: "join-at-4",
      productId: "bb2473b0-9b2e-4dd2-bd32-f29f7a4d0b3b",
      attributeId: "attr-2",
      orderIndex: 0,
      variant: "default",
      className: "",
    },
    {
      id: "join-at-5",
      productId: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      attributeId: "7a8a437aae24faeb",
      orderIndex: 0,
      variant: "featured",
      className: "pro-badge",
    },
    {
      id: "join-at-6",
      productId: "e939ed88-22ba-4630-b6d5-d2802c9f5bce",
      attributeId: "attr-2",
      orderIndex: 1,
      variant: "default",
      className: "",
    },
  ],
  order: [
    {
      id: "ord-1",
      customerName: "John Doe",
      total: 29.99,
      status: "completed",
    },
  ],
  "orders-to-products": [
    {
      id: "join-4",
      orderId: "ord-1",
      productId: "2a167247-3770-4365-8b8a-19935ab2b15f",
      quantity: 1,
    },
  ],
};

// Data Access Layer
export const api = {
  getModules: () => schema,

  getModel: (moduleSlug: string, modelSlug: string) => {
    const module = schema.find((m) => m.slug === moduleSlug);
    return module?.models.find((m) => m.slug === modelSlug);
  },

  getRecords: (modelSlug: string) => {
    return mockRecords[modelSlug] || [];
  },

  getRecord: (modelSlug: string, id: string) => {
    const records = mockRecords[modelSlug] || [];
    return records.find((r) => r.id === id);
  },

  getRelatedRecords: (
    sourceModelSlug: string,
    sourceId: string,
    relation: Relation,
  ) => {
    const joinRecords = mockRecords[relation.joinModelSlug] || [];
    const sourceField = `${sourceModelSlug}Id`;
    const targetField = `${relation.targetModelSlug}Id`;
    const relevantJoins = joinRecords.filter(
      (j) => j[sourceField] === sourceId,
    );
    return relevantJoins.map((join) => {
      const targetRecord = (mockRecords[relation.targetModelSlug] || []).find(
        (r) => r.id === join[targetField],
      );
      return { joinRecord: join, targetRecord };
    });
  },

  addRelation: (
    relation: Relation,
    sourceModelSlug: string,
    sourceId: string,
    targetId: string,
    metadata: any,
  ) => {
    const joinModelSlug = relation.joinModelSlug;
    if (!mockRecords[joinModelSlug]) mockRecords[joinModelSlug] = [];

    const sourceField = `${sourceModelSlug}Id`;
    const targetField = `${relation.targetModelSlug}Id`;

    const newJoin = {
      id: uuidv4(),
      [sourceField]: sourceId,
      [targetField]: targetId,
      ...metadata,
    };

    mockRecords[joinModelSlug].push(newJoin);
    return newJoin;
  },

  deleteRelation: (joinModelSlug: string, joinId: string) => {
    const records = mockRecords[joinModelSlug];
    if (!records) return;
    const index = records.findIndex((r) => r.id === joinId);
    if (index !== -1) {
      records.splice(index, 1);
    }
  },

  updateRecord: (modelSlug: string, id: string, data: any) => {
    const records = mockRecords[modelSlug];
    if (!records) return;
    const index = records.findIndex((r) => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...data };
    }
  },

  createRecord: (modelSlug: string, data: any) => {
    if (!mockRecords[modelSlug]) mockRecords[modelSlug] = [];
    const newRecord = { id: uuidv4(), ...data };
    mockRecords[modelSlug].push(newRecord);
    return newRecord;
  },

  deleteRecord: (modelSlug: string, id: string) => {
    const records = mockRecords[modelSlug];
    if (!records) return;
    const index = records.findIndex((r) => r.id === id);
    if (index !== -1) {
      records.splice(index, 1);
    }
  },

  getLabel: (modelSlug: string, id: string) => {
    const record = (mockRecords[modelSlug] || []).find((r) => r.id === id);
    if (!record) return id;
    if (record.adminTitle) return record.adminTitle;
    if (record.title) {
      if (typeof record.title === "object")
        return record.title.en || record.title.ru || "Untitled";
      return record.title;
    }
    if (record.name) return record.name;
    if (record.key) return record.key;
    return id;
  },
};

// ── Account & Settings Mock Data ─────────────────────────────────────────────

export const settingsOperationConfigs: Record<string, SettingsOperationConfig> =
  {
    backendCacheClear: {
      endpoint: "/api/http-cache/clear",
      method: "GET",
      title: "Clear backend cache?",
      description:
        "The backend HTTP cache will be cleared immediately for all users.",
      confirmLabel: "Clear cache",
      successMessage: "Backend cache has been cleared.",
    },
    frontendRevalidate: {
      endpoint: "/api/revalidate?path=/&type=layout",
      method: "GET",
      title: "Revalidate frontend layout?",
      description:
        "Frontend layout revalidation will be triggered for the root path.",
      confirmLabel: "Revalidate",
      successMessage: "Frontend revalidation has been triggered.",
    },
  };

export const accountSubject: AccountSubject = {
  id: "973e0fde-4786-413e-bc8f-2eecf4488e9d",
  slug: "rogwild",
  variant: "default",
  createdAt: "2025-03-09T13:16:15.559Z",
  updatedAt: "2026-02-19T21:22:01.000Z",
};

export const accountIdentities: AccountIdentity[] = [
  {
    id: "f3b3934d-3199-4f04-9e8e-99c4ab0a47a1",
    provider: "email_and_password",
    email: "rogwild@sps.dev",
    account: "",
    variant: "default",
    createdAt: "2025-03-09T13:17:10.100Z",
    updatedAt: "2026-02-12T10:41:33.004Z",
  },
  {
    id: "50ec6ff5-c7a0-42fb-95f9-4d3463c3acc9",
    provider: "telegram",
    email: "",
    account: "@rogwild",
    variant: "default",
    createdAt: "2025-09-21T07:21:09.330Z",
    updatedAt: "2026-02-10T08:13:02.551Z",
  },
  {
    id: "19ad0c8c-8bc9-465e-9df9-67be202e2a4d",
    provider: "oauth_google",
    email: "rogwild@gmail.com",
    account: "rogwild@gmail.com",
    variant: "default",
    createdAt: "2026-01-04T16:55:42.223Z",
    updatedAt: "2026-02-14T10:22:20.110Z",
  },
];

export const accountSubjectsToIdentities: SubjectToIdentity[] = [
  {
    id: "b887f4ef-fca1-46cc-9f39-c988f9b0b3d5",
    subjectId: accountSubject.id,
    identityId: accountIdentities[0].id,
    orderIndex: 0,
    variant: "default",
    className: "",
  },
  {
    id: "f8082360-6ccf-44e8-a1b1-c6fc7e2f7d57",
    subjectId: accountSubject.id,
    identityId: accountIdentities[1].id,
    orderIndex: 1,
    variant: "default",
    className: "",
  },
  {
    id: "baad8824-6f51-49da-a0a7-ff8f5f5d6285",
    subjectId: accountSubject.id,
    identityId: accountIdentities[2].id,
    orderIndex: 2,
    variant: "default",
    className: "",
  },
];

export const accountSocialProfiles: AccountSocialProfile[] = [
  {
    id: "2f6f62e1-5c1a-4fa3-983e-08469b11fa89",
    adminTitle: "Rogwild Profile",
    title: { en: "Rogwild", ru: "Рогвилд" },
    subtitle: {
      en: "Founder @ SinglePageStartup",
      ru: "Основатель @ SinglePageStartup",
    },
    description: {
      en: "Public profile for social interactions in SPS.",
      ru: "Публичный профиль для социальных взаимодействий в SPS.",
    },
    slug: "rogwild-profile",
    variant: "default",
    createdAt: "2025-06-01T12:12:01.002Z",
    updatedAt: "2026-02-16T09:45:40.120Z",
  },
];

export const accountSubjectsToSocialProfiles: SubjectToSocialProfile[] = [
  {
    id: "9f1c43fd-cbd8-4f59-b55f-3637804f5f32",
    subjectId: accountSubject.id,
    socialModuleProfileId: accountSocialProfiles[0].id,
    orderIndex: 0,
    variant: "default",
    className: "",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getLocalizedValue(value: any): string {
  if (!value) return "\u2014";
  if (typeof value === "string") return value || "\u2014";
  if (typeof value === "object") {
    return (
      value.en ||
      value.ru ||
      (Object.values(value).find(
        (v: any) => typeof v === "string" && v,
      ) as string) ||
      "\u2014"
    );
  }
  return String(value);
}

export interface IdentityProviderMeta {
  key: string;
  title: string;
  kind: "credentials" | "oauth" | "wallet" | "external";
  kindLabel: string;
  description: string;
}

export function getIdentityProviderMeta(
  provider: string,
): IdentityProviderMeta {
  const normalized = String(provider || "unknown").toLowerCase();

  if (normalized === "email_and_password" || normalized === "email") {
    return {
      key: normalized,
      title: "Email & Password",
      kind: "credentials",
      kindLabel: "Credentials",
      description:
        "Classic credential identity. Supports email updates and password rotation.",
    };
  }

  if (normalized === "telegram" || normalized.includes("telegram")) {
    return {
      key: normalized,
      title: "Telegram",
      kind: "oauth",
      kindLabel: "External",
      description:
        "External provider identity resolved via Telegram account and bot auth flow.",
    };
  }

  if (
    normalized.includes("oauth") ||
    normalized.includes("google") ||
    normalized.includes("github")
  ) {
    const label = normalized
      .replace(/_/g, "-")
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return {
      key: normalized,
      title: label,
      kind: "oauth",
      kindLabel: "External",
      description:
        "OAuth identity. Password management is handled by the upstream provider.",
    };
  }

  return {
    key: normalized,
    title: normalized
      .replace(/_/g, "-")
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" "),
    kind: "external",
    kindLabel: "External",
    description:
      "External identity provider. Available actions depend on provider capabilities.",
  };
}

export interface IdentityAction {
  key: string;
  label: string;
  tone: "neutral" | "danger";
}

export function getIdentityActions(
  identity: AccountIdentity,
): IdentityAction[] {
  const providerMeta = getIdentityProviderMeta(identity.provider);

  if (providerMeta.kind === "credentials") {
    return [
      { key: "change-email", label: "Change email", tone: "neutral" },
      { key: "change-password", label: "Change password", tone: "neutral" },
      { key: "delete", label: "Remove identity", tone: "danger" },
    ];
  }

  return [
    { key: "reconnect", label: "Reconnect", tone: "neutral" },
    { key: "delete", label: "Remove identity", tone: "danger" },
  ];
}

export function getIdentityPrimaryLogin(identity: AccountIdentity): string {
  return identity.email || identity.account || "No public account/email stored";
}

export function getIdentityOperationConfirm(
  identity: AccountIdentity | null,
  operationKey: string,
) {
  const providerMeta = getIdentityProviderMeta(identity?.provider || "");
  const providerTitle = providerMeta.title;

  if (operationKey === "change-email") {
    return {
      title: "Open email change flow?",
      description: `${providerTitle} identity will switch to email update flow.`,
      confirmLabel: "Continue",
    };
  }
  if (operationKey === "change-password") {
    return {
      title: "Open password change flow?",
      description:
        "Password update is available only for credential-based identities.",
      confirmLabel: "Continue",
    };
  }
  if (operationKey === "reconnect") {
    return {
      title: "Reconnect identity?",
      description: `${providerTitle} identity will run a fresh external authorization handshake.`,
      confirmLabel: "Reconnect",
    };
  }
  if (operationKey === "delete") {
    return {
      title: "Delete identity?",
      description:
        "This login method will be detached from the subject account.",
      confirmLabel: "Delete identity",
    };
  }
  return {
    title: "Run identity action?",
    description: "The selected identity action will be executed.",
    confirmLabel: "Run",
  };
}
