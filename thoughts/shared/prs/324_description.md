## Summary

Gives the repository a security policy. A researcher who finds a weakness now reaches GitHub private vulnerability reporting from the Security tab, from the README and from the new-issue chooser, instead of describing the weakness in a public issue. The policy also states which versions receive fixes, how disclosure is timed, and where a deployment operator finds the secret generation and rotation steps.

## Changes

- `SECURITY.md`: reporting channel, what to expect, supported versions, hardening pointers for deployments.
- `README.md`: a Security section before License that links the policy.
- `.github/ISSUE_TEMPLATE/config.yml`: a "Report a security vulnerability" contact link to the private reporting form.

## Verification

- [x] `npx prettier --check SECURITY.md README.md .github/ISSUE_TEMPLATE/config.yml`
- [x] Every path and heading the policy references exists: `GETTING_STARTED.md`, `tools/deployer/README.md` sections "Infrastructure security and operations", "Generating deployment secrets", "Rotating the secrets of a deployment that already bootstrapped", `.agents/workflows/engineering/adapt-upstream.md`.
- [x] Private vulnerability reporting is enabled on the repository, so the linked form exists.
- [ ] After merge: the Security tab shows the policy and the new-issue chooser shows the contact link.

## Notes

- The response times in the policy are proposals: acknowledgement within 5 business days, a fix on `main` within 30 days for a critical or high finding. Adjust them before merging if they are more than the project can promise.
- Downstream migration: the policy names this repository's reporting form and support scope. A project published under its own repository replaces the URL, the supported-versions text and the disclosure terms with its own, or points the file at its channel, and updates the contact link in `.github/ISSUE_TEMPLATE/config.yml` the same way. Verify by opening the project's Security tab and new-issue chooser.
