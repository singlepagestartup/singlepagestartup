import { Link } from "react-router";
import { ChevronRight, Shield } from "lucide-react";

const COMPANY = "[Company Name]";
const LAST_UPDATED = "20 февраля 2026";

export function PrivacyPolicyPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="transition hover:text-slate-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">Privacy Policy</span>
        </nav>

        {/* Header */}
        <div className="mb-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl tracking-tight text-slate-900">
              Privacy Policy
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="prose-slate space-y-8 text-sm text-slate-700 [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-base [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-0 [&_h3]:text-sm [&_h3]:text-slate-800 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_table]:w-full [&_table]:text-xs [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-slate-600 [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-2">
          <section>
            <h2>1. Introduction</h2>
            <p>
              {COMPANY} ("we", "us", "our") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your personal information when you use our
              website, platform, and related services (collectively, the
              "Service").
            </p>
            <p className="mt-2">
              By using the Service, you consent to the data practices described
              in this Privacy Policy. If you do not agree, please discontinue
              use of the Service immediately.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3 className="mt-4">2.1 Information You Provide Directly</h3>
            <ul>
              <li>
                <strong>Account Information:</strong> name, email address,
                password, phone number, billing address, and payment details
                when you register or make a purchase;
              </li>
              <li>
                <strong>Profile Information:</strong> avatar image, display
                name, bio, social links, and preferences;
              </li>
              <li>
                <strong>Communications:</strong> messages, chat content, support
                tickets, feedback, and any content you submit through the
                Service;
              </li>
              <li>
                <strong>User Content:</strong> files, documents, configurations,
                DNS records, and other data you upload or create within the
                Service.
              </li>
            </ul>

            <h3 className="mt-4">2.2 Information Collected Automatically</h3>
            <ul>
              <li>
                <strong>Device & Browser Data:</strong> IP address, browser type
                and version, operating system, device identifiers, screen
                resolution, and language preferences;
              </li>
              <li>
                <strong>Usage Data:</strong> pages visited, features used,
                clickstream data, time spent on pages, referring URLs, and
                navigation paths;
              </li>
              <li>
                <strong>Log Data:</strong> server logs, error reports, API call
                records, and performance metrics;
              </li>
              <li>
                <strong>Cookies & Tracking Technologies:</strong> cookies, web
                beacons, pixels, localStorage, and similar technologies (see
                Section 8).
              </li>
            </ul>

            <h3 className="mt-4">2.3 Information from Third Parties</h3>
            <ul>
              <li>
                Social login providers (Google, GitHub) when you choose to
                authenticate via these services;
              </li>
              <li>Payment processors for transaction verification;</li>
              <li>
                Publicly available information from domain registries (WHOIS
                data);
              </li>
              <li>Analytics and advertising partners.</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <table className="mt-3 rounded-lg border border-slate-200">
              <thead>
                <tr>
                  <th>Purpose</th>
                  <th>Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Providing and maintaining the Service</td>
                  <td>Contract performance</td>
                </tr>
                <tr>
                  <td>Processing transactions and billing</td>
                  <td>Contract performance</td>
                </tr>
                <tr>
                  <td>Account management and authentication</td>
                  <td>Contract performance</td>
                </tr>
                <tr>
                  <td>Customer support and communication</td>
                  <td>Legitimate interest</td>
                </tr>
                <tr>
                  <td>Personalization and recommendations</td>
                  <td>Legitimate interest / Consent</td>
                </tr>
                <tr>
                  <td>AI/ML model training and improvement</td>
                  <td>Legitimate interest / Consent</td>
                </tr>
                <tr>
                  <td>Analytics and Service improvement</td>
                  <td>Legitimate interest</td>
                </tr>
                <tr>
                  <td>Security, fraud detection, and abuse prevention</td>
                  <td>Legitimate interest / Legal obligation</td>
                </tr>
                <tr>
                  <td>Legal compliance and regulatory obligations</td>
                  <td>Legal obligation</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>
              4. Artificial Intelligence and Neural Network Data Processing
            </h2>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 my-3">
              <p className="text-xs text-amber-800">
                <span className="mr-1">⚠️</span>
                <strong>Important:</strong> This section describes how your data
                is processed by AI systems and may be used for machine learning
                purposes.
              </p>
            </div>

            <h3 className="mt-4">4.1 Data Processing by Neural Networks</h3>
            <p>
              Your data may be processed by artificial neural networks and other
              machine learning systems as part of the Service's core
              functionality. This processing includes, but is not limited to:
            </p>
            <ul className="mt-2">
              <li>
                Natural language processing of text inputs, queries, and
                communications;
              </li>
              <li>
                Pattern recognition and anomaly detection in usage data and
                system logs;
              </li>
              <li>Automated content analysis, categorization, and tagging;</li>
              <li>
                Predictive analytics for service recommendations and capacity
                planning;
              </li>
              <li>Automated moderation and security threat detection;</li>
              <li>Intelligent search and content retrieval optimization.</li>
            </ul>

            <h3 className="mt-4">4.2 Use of Data for AI Model Training</h3>
            <p>
              By using the Service, you acknowledge and consent to the
              following:
            </p>
            <ul className="mt-2">
              <li>
                <strong>Training Data.</strong> Your data, including text
                inputs, behavioral patterns, usage metadata, and interaction
                data, may be used to train, fine-tune, validate, and improve our
                neural networks and machine learning models.
              </li>
              <li>
                <strong>Anonymization.</strong> Before use in model training, we
                apply anonymization and pseudonymization techniques to minimize
                the identifiability of individual users. However, due to the
                nature of machine learning, we cannot guarantee that all
                personal information is completely removed from training
                datasets.
              </li>
              <li>
                <strong>Model Outputs.</strong> Trained models may generate
                outputs (e.g., text, recommendations, predictions) that are
                influenced by patterns learned from aggregated user data. These
                outputs are not intended to reproduce or reveal any individual
                user's data.
              </li>
              <li>
                <strong>Third-Party AI Services.</strong> We may use third-party
                AI providers (e.g., cloud-based ML services) to process your
                data. Such providers are bound by data processing agreements and
                are required to maintain appropriate security measures.
              </li>
              <li>
                <strong>Retention in Models.</strong> Once your data has been
                used to train a model, patterns derived from that data become
                part of the model's learned parameters. Deleting your account
                does not remove these learned patterns from already-trained
                models, though your raw data will be deleted from our training
                datasets.
              </li>
            </ul>

            <h3 className="mt-4">4.3 Opting Out of AI Training</h3>
            <p>
              You may request to opt out of having your data used for AI model
              training by contacting us at privacy@[domain].com. Please note:
            </p>
            <ul className="mt-2">
              <li>
                Opting out applies prospectively and does not affect models
                already trained;
              </li>
              <li>
                Certain AI-powered features may become unavailable or degraded
                if you opt out;
              </li>
              <li>
                Core AI processing required for Service delivery (e.g.,
                security, fraud detection) cannot be opted out of.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="mt-2">
              <li>
                <strong>Service Providers:</strong> hosting providers, payment
                processors, analytics tools, AI/ML service providers, and
                customer support platforms that assist in operating the Service;
              </li>
              <li>
                <strong>Business Partners:</strong> domain registries,
                certificate authorities, and infrastructure partners as
                necessary to provide the Service;
              </li>
              <li>
                <strong>Legal Requirements:</strong> when required by law,
                regulation, legal process, or governmental request;
              </li>
              <li>
                <strong>Business Transfers:</strong> in connection with a
                merger, acquisition, reorganization, or sale of assets;
              </li>
              <li>
                <strong>With Your Consent:</strong> when you have given explicit
                consent to share your information with specific third parties.
              </li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information to third parties for
              their direct marketing purposes.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide you with the Service. Specific
              retention periods include:
            </p>
            <ul className="mt-2">
              <li>
                <strong>Account data:</strong> duration of account plus 30 days
                after deletion request;
              </li>
              <li>
                <strong>Transaction records:</strong> 7 years (for tax and legal
                compliance);
              </li>
              <li>
                <strong>Communication logs:</strong> 2 years from the date of
                communication;
              </li>
              <li>
                <strong>Usage and analytics data:</strong> 24 months in
                identifiable form; indefinitely in anonymized/aggregated form;
              </li>
              <li>
                <strong>AI training data:</strong> anonymized data may be
                retained indefinitely as part of training datasets and learned
                model parameters;
              </li>
              <li>
                <strong>Server logs:</strong> 90 days.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              personal information, including:
            </p>
            <ul className="mt-2">
              <li>TLS/SSL encryption for all data in transit;</li>
              <li>AES-256 encryption for sensitive data at rest;</li>
              <li>Regular security audits and penetration testing;</li>
              <li>
                Access controls and role-based permissions for internal systems;
              </li>
              <li>Multi-factor authentication for administrative access;</li>
              <li>Automated intrusion detection and monitoring systems;</li>
              <li>Secure development lifecycle practices.</li>
            </ul>
            <p className="mt-2">
              While we strive to protect your personal information, no method of
              transmission over the Internet or method of electronic storage is
              100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>
              We use the following types of cookies and similar technologies:
            </p>
            <table className="mt-3 rounded-lg border border-slate-200">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Essential</td>
                  <td>Authentication, security, basic functionality</td>
                  <td>Session / 30 days</td>
                </tr>
                <tr>
                  <td>Functional</td>
                  <td>Preferences, language, theme settings</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>Analytics</td>
                  <td>Usage statistics, performance monitoring</td>
                  <td>2 years</td>
                </tr>
                <tr>
                  <td>AI Personalization</td>
                  <td>Behavioral tracking for ML-based recommendations</td>
                  <td>1 year</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">
              You can manage cookie preferences through your browser settings.
              Disabling certain cookies may affect Service functionality.
            </p>
          </section>

          <section>
            <h2>9. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="mt-2">
              <li>
                <strong>Right of Access:</strong> request a copy of the personal
                data we hold about you;
              </li>
              <li>
                <strong>Right to Rectification:</strong> request correction of
                inaccurate or incomplete data;
              </li>
              <li>
                <strong>Right to Erasure:</strong> request deletion of your
                personal data, subject to legal retention requirements and AI
                model limitations described in Section 4.2;
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> request
                restriction of processing in certain circumstances;
              </li>
              <li>
                <strong>Right to Data Portability:</strong> request your data in
                a structured, commonly used, machine-readable format;
              </li>
              <li>
                <strong>Right to Object:</strong> object to processing based on
                legitimate interest, including AI model training;
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> withdraw consent at
                any time where processing is based on consent;
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> file a complaint
                with your local data protection authority.
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at
              privacy@[domain].com. We will respond to your request within 30
              days.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your country of residence. These countries may have
              data protection laws that differ from the laws of your
              jurisdiction. We ensure appropriate safeguards are in place,
              including:
            </p>
            <ul className="mt-2">
              <li>
                Standard Contractual Clauses (SCCs) approved by relevant
                authorities;
              </li>
              <li>
                Data Processing Agreements with all third-party processors;
              </li>
              <li>Adequacy decisions where applicable.</li>
            </ul>
          </section>

          <section>
            <h2>11. Children's Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 16.
              We do not knowingly collect personal information from children
              under 16. If you believe we have collected such information,
              please contact us immediately and we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by email or through a prominent
              notice on the Service. Your continued use of the Service after the
              effective date of the revised Privacy Policy constitutes your
              acceptance of the changes.
            </p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p>{COMPANY}</p>
              <p className="mt-1">Data Protection Officer</p>
              <p>Email: privacy@[domain].com</p>
              <p>Address: [Your Address]</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
