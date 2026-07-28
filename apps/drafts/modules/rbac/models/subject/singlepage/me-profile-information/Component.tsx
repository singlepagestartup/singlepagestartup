import { Save } from "lucide-react";

import { defaultRbacUser, type RbacAccountUser } from "../../../../shared";

export interface SubjectMeProfileInformationProps {
  user: RbacAccountUser;
  title: string;
  bio: string;
  saveLabel: string;
}

export const defaultSubjectMeProfileInformationProps: SubjectMeProfileInformationProps =
  {
    user: defaultRbacUser,
    title: "Profile Information",
    bio: "Sarah leads product strategy for SPS, turning reusable modules into fast startup prototypes.",
    saveLabel: "Save Changes",
  };

export function SubjectMeProfileInformation(
  props?: Partial<SubjectMeProfileInformationProps>,
) {
  const { user, title, bio, saveLabel } = {
    ...defaultSubjectMeProfileInformationProps,
    ...props,
  };

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-ds-block="rbac.subject.me-profile-information"
      data-ds-layer="singlepage"
    >
      <h2 className="text-xl font-medium text-slate-900">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm text-slate-600">Full Name</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            readOnly
            value={user.name}
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Email</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            readOnly
            value={user.email}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm text-slate-600">Role</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            readOnly
            value={user.role}
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm text-slate-600">Bio</span>
          <textarea
            className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            readOnly
            value={bio}
          />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
          type="button"
        >
          <Save className="h-4 w-4" />
          {saveLabel}
        </button>
      </div>
    </article>
  );
}
