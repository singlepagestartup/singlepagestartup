# Issue: Implement Two-Phase Token Billing for OpenRouter with Usage Settlement and Message Metadata

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/158
**Status**: Research Needed
**Created**: 2026-04-14
**Priority**: high
**Size**: medium
**Type**: refactoring

---

## Problem to Solve

The OpenRouter reaction route currently charges a fixed pre-bill amount before execution, but it does not perform exact post-response settlement based on actual model usage. As a result, billing precision is low, and token consumption is not persisted on the generated message object.

We need to implement two-phase billing for OpenRouter:

1. minimal precharge before request execution,
2. exact settlement after response generation using actual OpenRouter usage and model pricing.

The solution must also persist consumption details in `social.message.metadata`, and enforce balance behavior so that one request may move balance negative, but any subsequent generation attempt must fail while balance is negative.

## Key Details

- Model routing and OpenRouter generation flow:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- Subscription and balance handling path:
  `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- Route pre-billing currently happens via middleware and RBAC bill-route service:
  `libs/middlewares/src/lib/bill-route/index.ts`
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.ts`
- Existing message metadata field already exists in DB schema:
  `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts`
- Required pricing conversion:
  `1 internal token = $0.001`
- Exact settlement policy:
  full reconciliation (refund when exact < precharged, additional charge when exact > precharged)
- Usage basis:
  sum usage from all OpenRouter calls in one request (classification, model selection, generation)

## Implementation Notes

- Extend OpenRouter service return payload to include usage and pricing-based cost data required for settlement.
- Keep precharge minimal (`1` token) in existing bill-route middleware path.
- Add settlement logic after generation to compute:
  `exactTokens = ceil(totalUsd / 0.001)`.
- Persist billing/usage trace in generated assistant message `metadata` (for example under `metadata.openRouter.billing`), including precharge, exact, delta, USD totals, and per-call usage.
- Add negative-balance guard in bill-route so new generations are rejected if current balance is below zero.
- Preserve existing user-facing “not enough tokens” behavior in agent flow.
- Add BDD tests for:
  usage→USD→token conversion,
  settlement refund/additional charge,
  first request allowed into negative,
  subsequent request blocked on negative,
  metadata persistence correctness.
