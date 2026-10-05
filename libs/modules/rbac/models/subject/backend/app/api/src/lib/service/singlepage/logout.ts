import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IExecuteProps as IMeExecuteProps } from "./me";

export interface IConstructorProps {
  me: (props: IMeExecuteProps) => Promise<IModel | null>;
  update: (props: { id: string; data: any }) => Promise<any>;
  invalidateSubjectRevocationCache: (subjectId: string) => void;
}

export interface IExecuteProps {
  token?: string;
}

export interface IResult {
  subject: IModel | null;
}

/**
 * Logs out the subject of the presented access token by marking when its
 * tokens stopped being valid. Every token of that subject signed up to this
 * moment is refused from then on, on this device and on every other, so
 * logout ends all sessions of the subject. A missing, invalid, expired or
 * already revoked token has nothing to revoke, and the mark stays where it
 * is: a replayed old token cannot end sessions started after it.
 *
 * Resolves to the subject whose tokens were revoked, or `null`.
 */
export class Service {
  me: IConstructorProps["me"];
  update: IConstructorProps["update"];
  invalidateSubjectRevocationCache: IConstructorProps["invalidateSubjectRevocationCache"];

  constructor(props: IConstructorProps) {
    this.me = props.me;
    this.update = props.update;
    this.invalidateSubjectRevocationCache =
      props.invalidateSubjectRevocationCache;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    const subject = props.token
      ? await this.me({ token: props.token }).catch(() => null)
      : null;

    if (!subject) {
      return { subject: null };
    }

    await this.update({
      id: subject.id,
      data: {
        tokensValidAfter: new Date(),
      },
    });

    this.invalidateSubjectRevocationCache(subject.id);

    return { subject };
  }
}
