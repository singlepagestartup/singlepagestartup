import { Shield } from "lucide-react";

import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { LegalPage, type LegalSection } from "../shared/LegalPage";

const COMPANY = "[Company Name]";
const LAST_UPDATED = "20 февраля 2026";

const privacySections: LegalSection[] = [
  {
    title: "1. Introduction",
    blocks: [
      {
        type: "paragraph",
        text: `${COMPANY} ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard personal information when you use our website, platform, and related services.`,
      },
      {
        type: "paragraph",
        text: "By using the Service, you consent to the data practices described in this Privacy Policy. If you do not agree, please discontinue use of the Service immediately.",
      },
    ],
  },
  {
    title: "2. Information We Collect",
    blocks: [
      {
        type: "subheading",
        text: "2.1 Information You Provide Directly",
      },
      {
        type: "list",
        items: [
          "Account information, including name, email address, password, phone number, billing address, and payment details.",
          "Profile information, including avatar image, display name, bio, social links, and preferences.",
          "Communications, including messages, chat content, support tickets, feedback, and any content you submit through the Service.",
          "User content, including files, documents, configurations, DNS records, and other data you upload or create within the Service.",
        ],
      },
      {
        type: "subheading",
        text: "2.2 Information Collected Automatically",
      },
      {
        type: "list",
        items: [
          "Device and browser data such as IP address, browser type, operating system, device identifiers, screen resolution, and language preferences.",
          "Usage data such as pages visited, features used, clickstream data, time spent on pages, referring URLs, and navigation paths.",
          "Log data such as server logs, error reports, API call records, and performance metrics.",
          "Cookies, web beacons, pixels, localStorage, and similar tracking technologies.",
        ],
      },
      {
        type: "subheading",
        text: "2.3 Information from Third Parties",
      },
      {
        type: "list",
        items: [
          "Social login providers when you choose to authenticate through Google, GitHub, or similar services.",
          "Payment processors for transaction verification.",
          "Publicly available information from domain registries and other records.",
          "Analytics and advertising partners.",
        ],
      },
    ],
  },
  {
    title: "3. How We Use Your Information",
    blocks: [
      {
        type: "paragraph",
        text: "We use collected information to provide, secure, personalize, and improve the Service.",
      },
      {
        type: "table",
        table: {
          headers: ["Purpose", "Legal Basis"],
          rows: [
            ["Providing and maintaining the Service", "Contract performance"],
            ["Processing transactions and billing", "Contract performance"],
            ["Account management and authentication", "Contract performance"],
            ["Customer support and communication", "Legitimate interest"],
            [
              "Personalization and recommendations",
              "Legitimate interest or consent",
            ],
            [
              "AI and machine learning model improvement",
              "Legitimate interest or consent",
            ],
            ["Analytics and Service improvement", "Legitimate interest"],
            [
              "Security, fraud detection, and abuse prevention",
              "Legitimate interest or legal obligation",
            ],
            ["Legal compliance and regulatory obligations", "Legal obligation"],
          ],
        },
      },
    ],
  },
  {
    title: "4. Artificial Intelligence and Neural Network Data Processing",
    blocks: [
      {
        type: "callout",
        text: "This section describes how your data may be processed by AI systems and may be used for machine learning purposes.",
      },
      {
        type: "paragraph",
        text: "The Service may process text inputs, usage patterns, uploaded content, interaction metadata, and related operational data through AI systems to provide features, generate recommendations, automate workflows, and improve system performance.",
      },
      {
        type: "list",
        items: [
          "AI outputs may contain inaccuracies, errors, or bias and should not be relied on as the only basis for critical decisions.",
          "Where technically feasible, you may opt out of certain AI data processing by contacting support, though some functionality may become limited.",
          "Anonymized and aggregated data may be used to improve models, detect anomalies, and increase Service quality.",
        ],
      },
    ],
  },
  {
    title: "5. Data Sharing and Disclosure",
    blocks: [
      {
        type: "paragraph",
        text: "We do not sell personal information. We may share information with service providers, payment processors, analytics partners, security vendors, professional advisers, and authorities when required by law.",
      },
      {
        type: "list",
        items: [
          "Service providers may access data only as needed to perform services on our behalf.",
          "Business transfers may involve disclosure during a merger, acquisition, financing, or sale of assets.",
          "Legal and safety disclosures may occur to protect rights, property, users, or the public.",
        ],
      },
    ],
  },
  {
    title: "6. Data Retention",
    blocks: [
      {
        type: "paragraph",
        text: "We retain personal information for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, enforce agreements, and maintain security.",
      },
      {
        type: "paragraph",
        text: "When information is no longer needed, we delete, anonymize, or aggregate it according to applicable requirements and internal retention practices.",
      },
    ],
  },
  {
    title: "7. Data Security",
    blocks: [
      {
        type: "paragraph",
        text: "We use administrative, technical, and organizational safeguards designed to protect information against unauthorized access, loss, misuse, alteration, and disclosure.",
      },
      {
        type: "paragraph",
        text: "No method of transmission or storage is completely secure. You are responsible for keeping account credentials confidential and notifying us about suspected unauthorized access.",
      },
    ],
  },
  {
    title: "8. Cookies and Tracking Technologies",
    blocks: [
      {
        type: "paragraph",
        text: "We use cookies and similar technologies to keep sessions active, remember preferences, analyze usage, improve performance, and protect the Service from abuse.",
      },
      {
        type: "paragraph",
        text: "You can control cookies through browser settings. Disabling cookies may affect authentication, personalization, and other Service features.",
      },
    ],
  },
  {
    title: "9. Your Rights",
    blocks: [
      {
        type: "paragraph",
        text: "Depending on your location, you may have rights to access, correct, delete, restrict, export, or object to certain processing of your personal information.",
      },
      {
        type: "list",
        items: [
          "Request access to personal information we hold about you.",
          "Request correction or deletion of inaccurate or unnecessary information.",
          "Opt out of certain marketing, analytics, or AI processing where available.",
          "Withdraw consent where processing depends on consent.",
        ],
      },
    ],
  },
  {
    title: "10. International Data Transfers",
    blocks: [
      {
        type: "paragraph",
        text: "Your information may be processed in countries other than the country where you live. When we transfer information internationally, we use appropriate safeguards required by applicable law.",
      },
    ],
  },
  {
    title: "11. Children's Privacy",
    blocks: [
      {
        type: "paragraph",
        text: "The Service is not directed to children under 13, and we do not knowingly collect personal information from children. If we learn that a child has provided personal information, we will take appropriate steps to delete it.",
      },
    ],
  },
  {
    title: "12. Changes to This Policy",
    blocks: [
      {
        type: "paragraph",
        text: "We may update this Privacy Policy from time to time. The updated version will be posted with a revised last updated date, and continued use of the Service means you accept the updated policy.",
      },
    ],
  },
  {
    title: "13. Contact Us",
    blocks: [
      {
        type: "paragraph",
        text: `If you have questions about this Privacy Policy or our data practices, contact ${COMPANY}.`,
      },
      {
        type: "list",
        items: [
          "Data Protection Officer: [DPO Name]",
          "Email: privacy@[domain].com",
          "Address: [Your Address]",
        ],
      },
    ],
  },
];

export function PrivacyPage() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.privacy"
    >
      <HostNavbarDefault />
      <LegalPage
        breadcrumbLabel="Privacy Policy"
        description="How SinglePageStartup collects, uses, protects, and shares information across the service."
        icon={Shield}
        sections={privacySections}
        title="Privacy Policy"
        updatedAt={LAST_UPDATED}
      />
      <FooterCompact />
    </main>
  );
}
