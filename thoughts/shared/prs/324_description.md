## Summary

Publish the framework's security reporting policy and direct vulnerability reports to GitHub's private form. The policy explains what to include, how maintainers coordinate fixes and disclosure, and how downstream projects receive fixes.

## Changes

- Add the private reporting instructions, version support and deployment security links to `SECURITY.md`.
- Link the policy from the README and the private form from the new-issue chooser.
- Describe Git synchronization before `adapt-upstream` and keep the reporting policy free of fixed response or remediation deadlines.

## Verification

- [x] Check formatting, parse the issue chooser YAML and verify the policy links and deployment headings.
- [x] Confirm private vulnerability reporting is enabled in the repository settings.
- [ ] Verify the Security tab and issue chooser after merge.

## Downstream migration

Projects that publish their own security policy should use their own private reporting URL in the policy and issue chooser, and document the versions and disclosure process they support. Enable private reporting in the project repository and verify the Security tab and issue chooser as a reporter.
