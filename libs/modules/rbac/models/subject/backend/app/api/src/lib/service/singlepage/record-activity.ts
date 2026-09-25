import { RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

export interface IConstructorProps {
  update: (props: { id: string; data: any }) => Promise<any>;
}

export interface IExecuteProps {
  subject: {
    id: string;
    updatedAt?: Date | string | null;
  };
}

/**
 * Records that a subject is still in use by touching `updatedAt` through the
 * repository update path. Anonymous retention reads that column as the last
 * activity, so every session renewal has to renew it - but at most once per
 * `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS`, so a busy session
 * does not write on every request.
 */
export class Service {
  update: IConstructorProps["update"];

  constructor(props: IConstructorProps) {
    this.update = props.update;
  }

  async execute(props: IExecuteProps): Promise<boolean> {
    const lastActivity = props.subject.updatedAt
      ? new Date(props.subject.updatedAt).getTime()
      : undefined;

    if (
      lastActivity !== undefined &&
      !Number.isNaN(lastActivity) &&
      Date.now() - lastActivity <
        RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS * 1000
    ) {
      return false;
    }

    try {
      await this.update({ id: props.subject.id, data: {} });

      return true;
    } catch (error: any) {
      logger.error("Rbac subject activity not recorded", {
        subjectId: props.subject.id,
        error,
      });

      return false;
    }
  }
}
