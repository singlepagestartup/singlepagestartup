import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  parseAIChatWebsite,
  parseAIChatServicePage,
  parseProjectDocumentDefinitions,
  parseProjectDocumentGuides,
  validateProjectDocumentGuides,
} from "../../../apps/studio/workspace/utils/products/ai-chat-content";

const root = path.resolve(import.meta.dir, "../../..");
const source = path.join(
  root,
  "apps/studio/workspace/products/singlepage/ai-chat/website",
);
const check = process.argv.includes("--check");
function publish(relative: string, data: string | Buffer) {
  if (relative.startsWith("apps/studio/modules/") && typeof data === "string")
    data = data
      .replaceAll("/workspace-assets/", "/module-assets/images/")
      .replaceAll("/workspace-products/", "/module-assets/documents/")
      .replaceAll("/workspace-design/", "/module-assets/design/");
  const destination = path.join(root, relative);
  if (check) {
    if (
      relative.endsWith(".json")
        ? JSON.stringify(JSON.parse(readFileSync(destination, "utf8"))) !==
          JSON.stringify(JSON.parse(String(data)))
        : !readFileSync(destination).equals(Buffer.from(data))
    )
      throw new Error(`AI Chat publication differs: ${relative}`);
  } else {
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, data);
  }
}
function servicePaths(value: unknown): unknown {
  if (typeof value === "string") {
    if (value === "/" || /^\/framework(?:[?#]|$)/.test(value)) return value;
    return value
      .replace(/\]\((\/(?!ai-chat\/)[^)]*)\)/g, (match, href: string) =>
        href === "/" || /^\/framework(?:[?#]|$)/.test(href)
          ? match
          : `](/ai-chat${href})`,
      )
      .replace(/^\/(?!ai-chat\/|workspace-assets\/)(.*)$/, "/ai-chat/$1");
  }
  if (Array.isArray(value)) return value.map(servicePaths);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, servicePaths(item)]),
    );
  return value;
}
const roles = readdirSync(path.join(root, ".agents/roles"))
  .filter((file) => file.endsWith(".md"))
  .sort()
  .flatMap((file) => {
    const text = readFileSync(path.join(root, ".agents/roles", file), "utf8");
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter || !/^kind: pre-development$/m.test(frontmatter[1]))
      return [];
    const id = frontmatter[1].match(/^id: (.+)$/m)?.[1];
    const source = `.agents/roles/${file}`;
    const adaptationSource = `apps/studio/workspace/products/singlepage/ai-chat/content/agent-roles/${file}`;
    const adaptation = readFileSync(path.join(root, adaptationSource), "utf8");
    const metadata = adaptation.match(/^---\n([\s\S]*?)\n---\n/);
    const sourceSha256 = createHash("sha256").update(text).digest("hex");
    if (
      !metadata ||
      metadata[1].match(/^id: (.+)$/m)?.[1] !== id ||
      metadata[1].match(/^source: (.+)$/m)?.[1] !== source ||
      metadata[1].match(/^source_sha256: (.+)$/m)?.[1] !== sourceSha256
    )
      throw new Error(
        `Reconcile ${adaptationSource} with ${source} before publishing AI Chat roles.`,
      );
    const description = metadata[1].match(/^description: (.+)$/m)?.[1];
    const role = adaptation.slice(metadata[0].length).trim();
    const name = role.match(/^# (.+)$/m)?.[1];
    if (!id || !description || !name)
      throw new Error(`Incomplete agent role: ${file}`);
    return [
      { id, name, description, role, source, sourceSha256, adaptationSource },
    ];
  });
if (!roles.length) throw new Error("No canonical pre-development roles found.");
publish(
  "apps/studio/workspace/utils/products/ai-chat-roles.generated.json",
  JSON.stringify(roles, null, 2) + "\n",
);

publish(
  "apps/studio/modules/social/profile/singlepage/agent/id/ai-chat/agents.json",
  JSON.stringify(roles, null, 2) + "\n",
);
const copies = {
  settings: "rbac/subject/me/delete/ai-chat",
  help: "website-builder/widget/content/ai-chat/help",
  tokens: "ecommerce/order/checkout/tokens/ai-chat",
};
const website = servicePaths(
  parseAIChatWebsite(readFileSync(path.join(source, "page.md"), "utf8")),
) as ReturnType<typeof parseAIChatWebsite>;
publish(
  "apps/studio/workspace/utils/products/ai-chat-website.generated.json",
  JSON.stringify(website, null, 2) + "\n",
);
publish(
  "apps/studio/modules/website-builder/widget/singlepage/content/ai-chat/website.json",
  JSON.stringify(website, null, 2) + "\n",
);
const landingCopies = {
  "content/ai-chat/hero": {
    hero: website.hero,
    labels: {
      "hero-photo-alt": website.labels["hero-photo-alt"],
      "navigation-foundation": website.labels["navigation-foundation"],
    },
  },
  "content/ai-chat/try": {
    workflow: website.workflow,
    uploadNote: website.labels["demo-upload-note"],
  },
  "content/ai-chat/continue": {
    continue: website.continue,
    terms: website.terms,
    startLink: website.hero.links[0],
  },
  "footer/ai-chat": website.footer,
};
for (const [variant, copy] of Object.entries(landingCopies))
  publish(
    `apps/studio/modules/website-builder/widget/singlepage/${variant}/content.json`,
    JSON.stringify(copy, null, 2) + "\n",
  );
for (const [name, owner] of Object.entries(copies)) {
  const [module, entity, ...variant] = owner.split("/");
  const text = readFileSync(path.join(source, `${name}.md`), "utf8");
  const copy = parseAIChatServicePage(text);
  publish(
    `apps/studio/modules/${module}/${entity}/singlepage/${variant.join("/")}/content.json`,
    JSON.stringify(servicePaths(copy), null, 2) + "\n",
  );
}
const helpCopy = servicePaths(
  parseAIChatServicePage(readFileSync(path.join(source, "help.md"), "utf8")),
) as ReturnType<typeof parseAIChatServicePage>;
publish(
  "apps/studio/modules/crm/form/singlepage/support/ai-chat/content.json",
  JSON.stringify(
    {
      title: helpCopy.sections.request.title,
      fields: Object.fromEntries(
        ["topic", "details", "result"].map((key) => [
          key,
          {
            label: helpCopy.labels[`${key}-label`],
            placeholder: helpCopy.labels[`${key}-placeholder`],
          },
        ]),
      ),
      topics: helpCopy.sections.topics.items.map((item) => item.title),
    },
    null,
    2,
  ) + "\n",
);
publish(
  "apps/studio/modules/rbac/subject/singlepage/me/crm-module/form/support/ai-chat/content.json",
  JSON.stringify(
    {
      labels: Object.fromEntries(
        Object.entries(helpCopy.labels).filter(([key]) =>
          [
            "topic-error",
            "details-error",
            "result-error",
            "submit",
            "success-message",
            "edit-request",
            "return-label",
            "return-href",
          ].includes(key),
        ),
      ),
      successParagraphs: helpCopy.sections.success.paragraphs,
    },
    null,
    2,
  ) + "\n",
);
for (const [name, form] of Object.entries({
  login: "authentication-form",
  register: "registration-form",
})) {
  const copy = servicePaths(
    parseAIChatServicePage(
      readFileSync(path.join(source, `${name}.md`), "utf8"),
    ),
  ) as ReturnType<typeof parseAIChatServicePage>;
  const labels = Object.fromEntries(
    Object.entries(copy.labels).filter(
      ([key]) => !/^(back-|photo-|secondary-photo-)/.test(key),
    ),
  );
  publish(
    `apps/studio/modules/rbac/subject/singlepage/me/authentication/email-and-password/${form}/ai-chat/content.json`,
    JSON.stringify(
      {
        title: copy.sections.account.title,
        description: copy.sections.account.paragraphs,
        successDescription: copy.sections.success.paragraphs,
        labels,
      },
      null,
      2,
    ) + "\n",
  );
  const content = {
    intro: {
      title: copy.sections.hero.title,
      paragraphs: copy.sections.hero.paragraphs,
    },
    images: ["photo", "secondary-photo"].flatMap((key) =>
      copy.labels[`${key}-src`]
        ? [
            {
              src: copy.labels[`${key}-src`],
              alt: copy.labels[`${key}-alt`],
              assetId: copy.labels[`${key}-asset-id`],
            },
          ]
        : [],
    ),
    aside: {
      title: copy.sections[name === "login" ? "recovery" : "materials"].title,
      paragraphs:
        copy.sections[name === "login" ? "recovery" : "materials"].paragraphs,
    },
  };
  publish(
    `apps/studio/modules/website-builder/widget/singlepage/content/ai-chat/authentication/${name === "login" ? "content" : "registration"}.json`,
    JSON.stringify(content, null, 2) + "\n",
  );
}
const definitions = parseProjectDocumentDefinitions(
  readFileSync(path.join(source, "project-workspace.md"), "utf8"),
);
const guideSource =
  "apps/studio/workspace/products/singlepage/ai-chat/content/document-guides.md";
const guides = parseProjectDocumentGuides(
  readFileSync(path.join(root, guideSource), "utf8"),
);
validateProjectDocumentGuides(definitions, guides);
const guidePublication = Object.fromEntries(
  Object.entries(guides).map(([id, guide]) => {
    if (!guide.basis) throw new Error(`Missing methodological basis: ${id}`);
    const templateSource = `.agents/templates/${id === "products" ? "products.yaml" : `${id}.md`}`;
    const template = readFileSync(path.join(root, templateSource), "utf8");
    const headings = [...template.matchAll(/^## (.+)$/gm)].map(
      (match) => match[1],
    );
    const fields = definitions[id].sections.map((section) => section.title);
    if (
      id === "products"
        ? fields.join("\n") !== "Products"
        : headings.join("\n") !== fields.slice(0, headings.length).join("\n") ||
          (id !== "product" && fields.length !== headings.length)
    )
      throw new Error(`AI Chat fields must follow ${templateSource}`);
    return [
      id,
      {
        ...guide,
        guideSource,
        templateSource,
        templateSha256: createHash("sha256").update(template).digest("hex"),
      },
    ];
  }),
);
publish(
  "apps/studio/workspace/utils/products/ai-chat-document-guides.generated.json",
  JSON.stringify(guidePublication, null, 2) + "\n",
);
publish(
  "apps/studio/modules/social/profile/singlepage/scope/ai-chat/project/definitions.json",
  JSON.stringify(definitions, null, 2) + "\n",
);
publish(
  "apps/studio/modules/knowledge/source/singlepage/id/ai-chat/guides.json",
  JSON.stringify(guidePublication, null, 2) + "\n",
);
publish(
  "apps/studio/workspace/utils/products/ai-chat-document-definitions.json",
  JSON.stringify(definitions, null, 2) + "\n",
);
publish(
  "apps/studio/modules/website-builder/widget/singlepage/content/ai-chat/guides.json",
  JSON.stringify(guidePublication, null, 2) + "\n",
);
const materials = readFileSync(path.join(source, "new-project.md"), "utf8");
publish(
  "apps/studio/modules/website-builder/widget/singlepage/content/ai-chat/materials-processing/disclosure.json",
  JSON.stringify(
    materials.slice(materials.indexOf("## Обработка и хранение материалов")),
    null,
    2,
  ) + "\n",
);
console.log(
  check
    ? "AI Chat Studio content is current."
    : "Generated AI Chat Studio content.",
);
