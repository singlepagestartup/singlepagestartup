import { Link } from "react-router";
import { ChevronRight, FileText } from "lucide-react";

const COMPANY = "[Company Name]";
const LAST_UPDATED = "20 февраля 2026";

export function TermsPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="transition hover:text-slate-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">Terms of Service</span>
        </nav>

        {/* Header */}
        <div className="mb-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl tracking-tight text-slate-900">
              Terms of Service
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose-slate space-y-8 text-sm text-slate-700 [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-base [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-0 [&_h3]:text-sm [&_h3]:text-slate-800 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the services provided by {COMPANY}{" "}
              (hereinafter "we", "us", "our", or the "Service"), you agree to be
              bound by these Terms of Service ("Terms"). If you do not agree to
              all of these Terms, you may not access or use the Service. These
              Terms constitute a legally binding agreement between you and{" "}
              {COMPANY}.
            </p>
            <p className="mt-2">
              We reserve the right to update or modify these Terms at any time
              without prior notice. Your continued use of the Service after any
              such changes constitutes your acceptance of the new Terms. We
              recommend reviewing these Terms periodically.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              {COMPANY} provides a web-based platform for domain management,
              digital services, and related tools (collectively, the "Service").
              The Service may include, but is not limited to:
            </p>
            <ul className="mt-2">
              <li>Domain registration, transfer, and management</li>
              <li>Web hosting and infrastructure services</li>
              <li>SSL/TLS certificate provisioning</li>
              <li>DNS management and configuration</li>
              <li>Communication and collaboration tools</li>
              <li>Analytics, monitoring, and reporting dashboards</li>
              <li>AI-powered recommendations and automation features</li>
            </ul>
          </section>

          <section>
            <h2>3. Account Registration and Security</h2>
            <p>
              To use certain features of the Service, you must register for an
              account. You agree to:
            </p>
            <ol className="mt-2">
              <li>
                Provide accurate, current, and complete information during
                registration;
              </li>
              <li>Maintain and promptly update your account information;</li>
              <li>
                Keep your password confidential and not share it with third
                parties;
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account;
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account or
                any other security breach.
              </li>
            </ol>
            <p className="mt-2">
              We reserve the right to suspend or terminate your account if any
              information provided is found to be inaccurate, misleading, or
              incomplete, or if we reasonably believe your account has been
              compromised.
            </p>
          </section>

          <section>
            <h2>4. Use of Artificial Intelligence and Neural Networks</h2>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 my-3">
              <p className="text-xs text-amber-800">
                <span className="mr-1">⚠️</span>
                <strong>Important:</strong> Please read this section carefully.
                It describes how your data may be processed by AI systems.
              </p>
            </div>
            <p>
              The Service utilizes artificial intelligence technologies,
              including neural networks and machine learning models, to provide,
              improve, and personalize your experience. By using the Service,
              you acknowledge and agree that:
            </p>
            <ul className="mt-2">
              <li>
                <strong>Data Processing by Neural Networks.</strong> Your data,
                including but not limited to text inputs, queries, usage
                patterns, behavioral data, uploaded content, and interaction
                metadata, may be processed by neural networks and other AI
                systems for the purpose of providing the Service, generating
                recommendations, automating workflows, and improving system
                performance.
              </li>
              <li>
                <strong>Use for Model Training.</strong> Your data, in
                anonymized and aggregated form, may be used for training,
                fine-tuning, and improving our machine learning models and
                neural networks. This includes but is not limited to improving
                natural language processing, predictive analytics, content
                generation, anomaly detection, and recommendation systems.
              </li>
              <li>
                <strong>No Guarantee of Accuracy.</strong> AI-generated outputs,
                including recommendations, predictions, summaries, and automated
                decisions, are provided "as is" and may contain inaccuracies,
                errors, or biases. You should not rely solely on AI-generated
                content for critical decisions without independent verification.
              </li>
              <li>
                <strong>Continuous Improvement.</strong> Our AI systems are
                continuously learning and evolving. The quality, accuracy, and
                behavior of AI features may change over time as models are
                retrained and updated.
              </li>
            </ul>
            <p className="mt-2">
              You may opt out of certain AI data processing features where
              technically feasible by contacting our support team. However,
              opting out may limit the functionality of certain Service
              features.
            </p>
          </section>

          <section>
            <h2>5. User Content and Intellectual Property</h2>
            <p>
              You retain ownership of all content you submit, upload, or
              transmit through the Service ("User Content"). By submitting User
              Content, you grant {COMPANY} a worldwide, non-exclusive,
              royalty-free, sublicensable license to use, reproduce, modify,
              adapt, publish, translate, and distribute such content for the
              purposes of operating, providing, and improving the Service,
              including AI model training as described in Section 4.
            </p>
            <p className="mt-2">
              You represent and warrant that you own or have the necessary
              rights to all User Content you submit and that such content does
              not violate any third party's intellectual property rights,
              privacy rights, or any applicable law.
            </p>
          </section>

          <section>
            <h2>6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="mt-2">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws or regulations;
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service,
                other accounts, or computer systems;
              </li>
              <li>
                Transmit any viruses, malware, worms, or other malicious code;
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service;
              </li>
              <li>
                Use automated means (bots, scrapers, etc.) to access the Service
                without our prior written consent;
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any portion of the
                Service;
              </li>
              <li>
                Use the Service to send unsolicited communications (spam);
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your
                affiliation with any person or entity;
              </li>
              <li>
                Attempt to extract, reverse engineer, or replicate the AI
                models, training data, or algorithms used by the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Payment and Billing</h2>
            <p>
              Certain features of the Service require payment. You agree to pay
              all fees associated with your selected plan or purchased services.
              All fees are non-refundable unless otherwise stated or required by
              applicable law.
            </p>
            <ul className="mt-2">
              <li>Prices are subject to change with 30 days' prior notice;</li>
              <li>
                Recurring subscriptions will automatically renew unless
                cancelled before the renewal date;
              </li>
              <li>
                Failure to pay may result in suspension or termination of your
                account;
              </li>
              <li>
                All amounts are quoted and payable in the currency specified at
                the time of purchase.
              </li>
            </ul>
          </section>

          <section>
            <h2>8. Service Availability and Modifications</h2>
            <p>
              We strive to maintain Service availability but do not guarantee
              uninterrupted or error-free operation. We reserve the right to:
            </p>
            <ul className="mt-2">
              <li>
                Modify, suspend, or discontinue any part of the Service at any
                time;
              </li>
              <li>Perform scheduled and unscheduled maintenance;</li>
              <li>
                Limit certain features or restrict access to parts of the
                Service;
              </li>
              <li>
                Update AI models and algorithms, which may affect Service
                behavior and outputs.
              </li>
            </ul>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, {COMPANY} shall
              not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to
              loss of profits, data, business opportunities, or goodwill,
              arising out of or related to your use of the Service.
            </p>
            <p className="mt-2">
              In particular, {COMPANY} shall not be liable for any damages
              arising from AI-generated outputs, recommendations, or automated
              decisions, including those resulting from inaccuracies, errors,
              biases, or hallucinations in neural network outputs.
            </p>
            <p className="mt-2">
              Our total aggregate liability shall not exceed the amount you paid
              to {COMPANY} in the twelve (12) months preceding the event giving
              rise to the claim.
            </p>
          </section>

          <section>
            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless {COMPANY}, its
              officers, directors, employees, agents, and affiliates from and
              against any claims, liabilities, damages, losses, and expenses
              (including reasonable attorneys' fees) arising from your use of
              the Service, your User Content, your violation of these Terms, or
              your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service
              immediately, without prior notice, for any reason, including but
              not limited to a breach of these Terms. Upon termination:
            </p>
            <ul className="mt-2">
              <li>Your right to use the Service will immediately cease;</li>
              <li>
                We may delete your account data after a reasonable retention
                period;
              </li>
              <li>
                Previously processed data that has been incorporated into AI
                models in anonymized form may persist as part of the trained
                models;
              </li>
              <li>
                Provisions of these Terms that by their nature should survive
                termination shall survive.
              </li>
            </ul>
          </section>

          <section>
            <h2>12. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which {COMPANY} is incorporated,
              without regard to its conflict of law principles. Any disputes
              arising under these Terms shall be resolved through binding
              arbitration in accordance with the rules of the applicable
              arbitration authority, unless otherwise required by applicable
              law.
            </p>
          </section>

          <section>
            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is held to be invalid, illegal, or
              unenforceable, the remaining provisions shall continue in full
              force and effect. The invalid provision shall be modified to the
              minimum extent necessary to make it valid, legal, and enforceable
              while preserving its original intent.
            </p>
          </section>

          <section>
            <h2>14. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p>{COMPANY}</p>
              <p className="mt-1">Email: legal@[domain].com</p>
              <p>Address: [Your Address]</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
