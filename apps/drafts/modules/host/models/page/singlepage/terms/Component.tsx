import { FileText } from "lucide-react";

import { FooterCompact } from "../../../../../website-builder/models/widget/singlepage/footer-compact/Component";
import { HostNavbarDefault } from "../shared/HostNavbarDefault";
import { LegalPage, type LegalSection } from "../shared/LegalPage";

const COMPANY = "[Company Name]";
const LAST_UPDATED = "20 февраля 2026";

const termsSections: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    blocks: [
      {
        type: "paragraph",
        text: `By accessing or using the services provided by ${COMPANY}, you agree to be bound by these Terms of Service. If you do not agree to all of these Terms, you may not access or use the Service.`,
      },
      {
        type: "paragraph",
        text: "We reserve the right to update or modify these Terms at any time. Your continued use of the Service after changes are posted constitutes acceptance of the updated Terms.",
      },
    ],
  },
  {
    title: "2. Description of Service",
    blocks: [
      {
        type: "paragraph",
        text: `${COMPANY} provides a web-based platform for domain management, digital services, and related tools.`,
      },
      {
        type: "list",
        items: [
          "Domain registration, transfer, and management.",
          "Web hosting and infrastructure services.",
          "SSL and TLS certificate provisioning.",
          "DNS management and configuration.",
          "Communication and collaboration tools.",
          "Analytics, monitoring, and reporting dashboards.",
          "AI-powered recommendations and automation features.",
        ],
      },
    ],
  },
  {
    title: "3. Account Registration and Security",
    blocks: [
      {
        type: "paragraph",
        text: "To use certain features, you must register for an account and provide accurate, current, and complete information.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Maintain and promptly update account information.",
          "Keep your password confidential and not share it with third parties.",
          "Accept responsibility for activity that occurs under your account.",
          "Notify us immediately of unauthorized use or any other security breach.",
        ],
      },
      {
        type: "paragraph",
        text: "We may suspend or terminate accounts if information is inaccurate, misleading, incomplete, or if we reasonably believe an account has been compromised.",
      },
    ],
  },
  {
    title: "4. Use of Artificial Intelligence and Neural Networks",
    blocks: [
      {
        type: "callout",
        text: "This section describes how your data may be processed by AI systems.",
      },
      {
        type: "paragraph",
        text: "The Service may use artificial intelligence technologies, neural networks, and machine learning models to provide, improve, and personalize your experience.",
      },
      {
        type: "list",
        items: [
          "Your inputs, usage patterns, uploaded content, and interaction metadata may be processed by AI systems to provide the Service.",
          "Anonymized and aggregated data may be used for training, fine-tuning, and improving machine learning models.",
          "AI-generated outputs may contain inaccuracies, errors, or bias and are provided as is.",
          "You may request to opt out of certain AI data processing where technically feasible.",
        ],
      },
    ],
  },
  {
    title: "5. User Content and Intellectual Property",
    blocks: [
      {
        type: "paragraph",
        text: "You retain ownership of content you submit, upload, or transmit through the Service. By submitting content, you grant us a license to use it as necessary to operate, provide, and improve the Service.",
      },
      {
        type: "paragraph",
        text: "You represent that you own or have the necessary rights to submitted content and that it does not violate third party rights or applicable law.",
      },
    ],
  },
  {
    title: "6. Prohibited Conduct",
    blocks: [
      {
        type: "paragraph",
        text: "You agree not to misuse the Service or help anyone else do so.",
      },
      {
        type: "list",
        items: [
          "Violate laws, regulations, intellectual property rights, privacy rights, or contractual rights.",
          "Attempt to gain unauthorized access to systems, data, accounts, or networks.",
          "Interfere with Service availability, security, integrity, or performance.",
          "Upload malware, harmful code, spam, or deceptive content.",
          "Use the Service to build competing services through unauthorized scraping, copying, or reverse engineering.",
        ],
      },
    ],
  },
  {
    title: "7. Payment and Billing",
    blocks: [
      {
        type: "paragraph",
        text: "Paid services require valid payment information. You authorize us and our payment processors to charge applicable fees, taxes, and recurring subscription amounts when due.",
      },
      {
        type: "paragraph",
        text: "Unless stated otherwise, fees are non-refundable except where required by law or expressly provided in a separate agreement.",
      },
    ],
  },
  {
    title: "8. Service Availability and Modifications",
    blocks: [
      {
        type: "paragraph",
        text: "We aim to keep the Service available and reliable, but we do not guarantee uninterrupted or error-free operation. We may modify, suspend, or discontinue features at any time.",
      },
    ],
  },
  {
    title: "9. Limitation of Liability",
    blocks: [
      {
        type: "paragraph",
        text: "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss of profits, revenue, data, or goodwill.",
      },
    ],
  },
  {
    title: "10. Indemnification",
    blocks: [
      {
        type: "paragraph",
        text: "You agree to defend, indemnify, and hold us harmless from claims, liabilities, damages, losses, and expenses arising from your use of the Service, your content, or your violation of these Terms.",
      },
    ],
  },
  {
    title: "11. Termination",
    blocks: [
      {
        type: "paragraph",
        text: "You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms, create risk, or if required by law.",
      },
    ],
  },
  {
    title: "12. Governing Law and Dispute Resolution",
    blocks: [
      {
        type: "paragraph",
        text: "These Terms are governed by the laws specified in the applicable order, contract, or account terms. Disputes will be resolved through the procedures stated in those documents or as required by applicable law.",
      },
    ],
  },
  {
    title: "13. Severability",
    blocks: [
      {
        type: "paragraph",
        text: "If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.",
      },
    ],
  },
  {
    title: "14. Contact Information",
    blocks: [
      {
        type: "paragraph",
        text: `If you have questions about these Terms, contact ${COMPANY}.`,
      },
      {
        type: "list",
        items: ["Email: legal@[domain].com", "Address: [Your Address]"],
      },
    ],
  },
];

export function TermsPage() {
  return (
    <main
      className="min-h-screen bg-[#eaf0f7] text-slate-900 antialiased"
      data-ds-page="host.page.terms"
    >
      <HostNavbarDefault />
      <LegalPage
        breadcrumbLabel="Terms of Service"
        description="The terms that govern access to and use of SinglePageStartup services."
        icon={FileText}
        sections={termsSections}
        title="Terms of Service"
        updatedAt={LAST_UPDATED}
      />
      <FooterCompact />
    </main>
  );
}
