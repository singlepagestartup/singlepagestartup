# Shared frontend component readers

The default model and collection readers use their SDK and Provider unless the
caller explicitly selects `dataSource="props"`.

That mode renders the current `data` from an owning parent SDK reader. The parent
keeps the React Query query, authorization scope, subscriptions, loading/error
state and mutation/realtime reconciliation. It passes a loaded record to a
model view, or loaded `data` to a collection view. Updating those props renders
the new result without a second request, Provider or constant query function.
SDK bindings and reader implementation props do not reach the record view.

Use this mode to compose a scoped parent query through another model's public
variant. It does not grant access to the general model endpoint and is not a
source of hardcoded production records. A snapshot without a live SDK owner
cannot provide refresh or realtime behavior.

`Skeleton={<Skeleton />}` supplies the same React node to the shared server
Suspense boundary and the client reader's pending state. Specialized readers
keep the appropriate local loading view for their additional SDK operation.
Subject variants also pass that node as `skeleton` for JWT/session loading.
