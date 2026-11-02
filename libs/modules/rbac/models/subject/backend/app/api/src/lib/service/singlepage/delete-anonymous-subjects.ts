import {
  RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE,
  RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS,
} from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";
import { IModel } from "@sps/rbac/models/subject/sdk/model";

/**
 * Only ordinary visitor subjects are cleaned up. Agent, hidden and every other
 * project-defined variant stays out of the candidate query.
 */
export const ANONYMOUS_SUBJECT_VARIANT = "default";

export interface IRetentionBlocker {
  reason: string;
  find: (
    props?: any,
  ) => Promise<{ subjectId?: string | null }[] | undefined | null>;
}

export interface IConstructorProps {
  find: (props?: any) => Promise<IModel[]>;
  delete: (props: { id: string }) => Promise<any>;
  blockers: IRetentionBlocker[];
}

export interface IExecuteProps {
  retentionInSeconds?: number;
  batchSize?: number;
}

export interface IResult {
  scanned: number;
  deleted: number;
  failed: number;
  retained: number;
  retainedByReason: Record<string, number>;
}

/**
 * Removes anonymous subjects that have been inactive for the retention period
 * and own nothing. This is the only anonymous cleanup implementation; the
 * scheduled agent calls it through the module route.
 *
 * One run reads one bounded batch, ordered by last activity, and looks the
 * blocking relations up for that batch only. A project adds its own blockers
 * from the `startup` service layer instead of editing this file.
 */
export class Service {
  find: IConstructorProps["find"];
  delete: IConstructorProps["delete"];
  blockers: IConstructorProps["blockers"];

  constructor(props: IConstructorProps) {
    this.find = props.find;
    this.delete = props.delete;
    this.blockers = props.blockers;
  }

  async execute(props?: IExecuteProps): Promise<IResult> {
    const retentionInSeconds =
      props?.retentionInSeconds || RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS;
    const batchSize =
      props?.batchSize || RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE;

    const result: IResult = {
      scanned: 0,
      deleted: 0,
      failed: 0,
      retained: 0,
      retainedByReason: {},
    };

    const candidates = await this.find({
      params: {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: ANONYMOUS_SUBJECT_VARIANT,
            },
            {
              column: "updatedAt",
              method: "lt",
              value: new Date(
                Date.now() - retentionInSeconds * 1000,
              ).toISOString(),
            },
          ],
        },
        limit: batchSize,
        orderBy: {
          and: [
            {
              column: "updatedAt",
              method: "asc",
            },
          ],
        },
      },
    });

    if (!candidates?.length) {
      return result;
    }

    result.scanned = candidates.length;

    const candidateIds = candidates.map((candidate) => candidate.id);
    const blockedIds = await this.findBlockedIds({
      candidateIds,
      result,
    });

    result.retained = blockedIds.size;

    for (const candidate of candidates) {
      if (blockedIds.has(candidate.id)) {
        continue;
      }

      try {
        await this.delete({ id: candidate.id });

        result.deleted += 1;
      } catch (error: any) {
        result.failed += 1;

        logger.error("Rbac anonymous subject not deleted", {
          subjectId: candidate.id,
          error,
        });
      }
    }

    return result;
  }

  protected async findBlockedIds(props: {
    candidateIds: string[];
    result: IResult;
  }): Promise<Set<string>> {
    const blockedIds = new Set<string>();

    for (const blocker of this.blockers) {
      const relations = await blocker.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "inArray",
                value: props.candidateIds,
              },
            ],
          },
        },
      });

      if (!relations?.length) {
        continue;
      }

      for (const relation of relations) {
        const subjectId = relation?.subjectId;

        if (!subjectId || blockedIds.has(subjectId)) {
          continue;
        }

        blockedIds.add(subjectId);

        props.result.retainedByReason[blocker.reason] =
          (props.result.retainedByReason[blocker.reason] || 0) + 1;
      }
    }

    return blockedIds;
  }
}
