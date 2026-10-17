import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async execute({
    subjectId,
  }: IExecuteProps): Promise<
    (IModel & { authenticated: boolean }) | undefined
  > {
    const subject = await this.service.findById({ id: subjectId });
    if (!subject) return;
    const identities = await this.service.subjectsToIdentities.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: subjectId }],
        },
        limit: 1,
      },
    });
    return { ...subject, authenticated: !!identities?.length };
  }
}
