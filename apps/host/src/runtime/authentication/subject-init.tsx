import { Component as SubjectAuthenticationInit } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default";

export function SubjectAuthenticationInitBoundary() {
  return (
    <SubjectAuthenticationInit
      isServer={false}
      variant="authentication-init-default"
    />
  );
}
