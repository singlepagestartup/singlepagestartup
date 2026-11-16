import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  token: string;
  guestSessionToken?: string;
  socialModuleProfileId?: string;
  socialModuleProfileSelections?: Record<string, string>;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async execute(props: IExecuteProps): Promise<void> {
    if (!props.guestSessionToken) {
      return;
    }
    const source = await this.service.me({ token: props.guestSessionToken });
    const target = await this.service.me({ token: props.token });
    if (!source || !target) {
      throw new Error(
        "Authentication error. Cart handoff requires valid sessions",
      );
    }
    if (source.id === target.id) {
      return;
    }
    const identities = await this.service.subjectsToIdentities.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: source.id }],
        },
        limit: 1,
      },
    });
    if (identities.length) {
      return;
    }
    await this.service.ecommerceModuleMergeGuestCart({
      sourceSubjectId: source.id,
      subjectId: target.id,
      socialModuleProfileId:
        props.socialModuleProfileId ??
        props.socialModuleProfileSelections?.[target.id],
    });
  }
}
