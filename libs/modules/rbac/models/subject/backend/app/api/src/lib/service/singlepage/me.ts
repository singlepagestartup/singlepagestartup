import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { verifyJwt } from "@sps/backend-utils";
import {
  IModel,
  isRbacSubjectTokenRevoked,
} from "@sps/rbac/models/subject/sdk/model";

export interface IConstructorProps {
  findById: (props: { id: string }) => Promise<IModel | null>;
}

export interface IExecuteProps {
  token: string;
}

/**
 * Resolves the subject of an access token from the database, so the answer is
 * the stored row rather than whatever the token carried when it was signed. A
 * refresh token, and a token signed before its subject last logged out, are
 * refused; a token whose subject no longer exists resolves to `null`.
 */
export class Service {
  findById: IConstructorProps["findById"];

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
  }

  async execute(props: IExecuteProps): Promise<IModel | null> {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    const decoded = await verifyJwt(props.token, RBAC_JWT_SECRET, {
      type: "access",
    });
    const subjectId = decoded.subject?.["id"];

    if (typeof subjectId !== "string" || !subjectId) {
      throw new Error("Validation error. No subject provided in the token");
    }

    const subject = await this.findById({ id: subjectId });

    if (!subject) {
      return null;
    }

    if (isRbacSubjectTokenRevoked({ subject, issuedAt: decoded.iat })) {
      throw new Error("Authentication error. Token revoked");
    }

    return subject;
  }
}
