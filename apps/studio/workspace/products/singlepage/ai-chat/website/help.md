---
confirmation:
  confirmed: false
sources:
  request_receipt:
    classification: verified-fact
    inspected_snapshot: aa780be0f99f78f5d25802d259059cb1b66f4cb0
    source: libs/modules/rbac/models/subject/README.md
    supports: The owned CRM request flow distinguishes a saved Request from notification readiness; a repeated submission returns the saved receipt without resending.
    limitation: A saved Request proves storage, not successful email delivery. Product preview feedback is supplied local state. The 24-hour initial-response expectation remains the Sales promise rather than measured delivery evidence.
review:
  dependencies:
    product.ai-chat.website: 01b952c5fa54af025f65408e64fd34bb8ab17b40c54ccecbf01604312b1abdc2
---

# Get help

<!-- section: hero -->

## What stopped you?

Tell us what you were trying to do, what happened and the result you need. Name the project or payment when it matters to the question.

<!-- section: request -->

## Support request

| Field                    | What to include                                          |
| ------------------------ | -------------------------------------------------------- |
| Topic                    | Choose the part of AI Chat your question concerns.       |
| What happened?           | Describe the action, the result and any message you saw. |
| What result do you need? | Explain what you want to continue or correct.            |

<!-- section: topics -->

## Choose a topic

| Topic                   | Scope                                              |
| ----------------------- | -------------------------------------------------- |
| Account access          | Registration, sign-in or password help.            |
| Project documents       | Drafts, identified shortcomings, edits and review. |
| Files and images        | Adding material or working with supplied files.    |
| Chat threads and topics | Document discussions and project conversations.    |
| Export                  | Downloading and using your documents.              |
| Tokens and payment      | Balance, top-ups, receipts or a payment result.    |
| Other                   | Another question about AI Chat.                    |

<!-- section: response -->

## What happens next

Support requests are processed within 24 hours. This is the initial response expectation, not a promise to resolve every request within that time. Continuous live support is outside the current service.

Keep your saved documents and task in place while you wait. [Return to the workspace](/ai-chat/social/profiles/example).

<!-- section: success -->

## Request saved

Your support request is saved. You can keep working in your workspace while it is reviewed. A saved request does not confirm that an email notification was delivered.

<!-- section: controls -->

## Interface labels

| Control             | Text                                          |
| ------------------- | --------------------------------------------- |
| back-label          | Back to workspace                             |
| back-href           | /ai-chat/social/profiles/example              |
| topic-label         | Topic                                         |
| topic-placeholder   | Select a topic                                |
| details-label       | What happened?                                |
| details-placeholder | Describe what you tried and what happened.    |
| result-label        | What result do you need?                      |
| result-placeholder  | Tell us what you want to continue or correct. |
| submit              | Send request                                  |
| edit-request        | Edit request                                  |
| return-label        | Return to workspace                           |
| return-href         | /ai-chat/social/profiles/example              |
| topic-error         | Choose a topic.                               |
| details-error       | Describe what happened.                       |
| result-error        | Tell us what result you need.                 |
| success-message     | Support request saved.                        |
