import type { Service as SubjectService } from "../../index";
import { Service as ProfileOwnership } from "../../../startup/social-module/profile/ownership";

export interface IExecuteProps {
  subjectId: string;
  socialModuleProfileId?: string;
  createIfMissing?: boolean;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async execute(props: IExecuteProps): Promise<string> {
    const links = await this.service.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: props.subjectId }],
        },
      },
    });
    const profileIds = [
      ...new Set((links ?? []).map((link) => link.socialModuleProfileId)),
    ];
    if (props.socialModuleProfileId) {
      if (!profileIds.includes(props.socialModuleProfileId)) {
        throw new Error(
          "Permission error. Profile does not belong to the current subject",
        );
      }
      const profile = await this.service.socialModule.profile.findById({
        id: props.socialModuleProfileId,
      });
      if (!profile) {
        throw new Error("Permission error. Profile is unavailable");
      }
      return props.socialModuleProfileId;
    }
    if (profileIds.length === 1) {
      return this.execute({ ...props, socialModuleProfileId: profileIds[0] });
    }
    if (profileIds.length > 1) {
      throw new Error("Validation error. Select a socialModuleProfileId");
    }
    if (!props.createIfMissing) {
      throw new Error("Permission error. Subject has no personal profile");
    }
    const ownership = await new ProfileOwnership(this.service).ensure({
      subjectId: props.subjectId,
      allowGuest: true,
    });
    return ownership.profile.id;
  }
}
