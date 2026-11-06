export interface IActionRowMemoProps {
  action: {
    id: string;
    updatedAt: string | Date;
    actorProfiles?: import("@sps/social/models/profile/sdk/model").IProfilePresentation[];
  };
  language: string;
}

export function areActionRowPropsEqual(
  previous: IActionRowMemoProps,
  next: IActionRowMemoProps,
) {
  return (
    previous.language === next.language &&
    previous.action.actorProfiles === next.action.actorProfiles &&
    previous.action.id === next.action.id &&
    String(previous.action.updatedAt) === String(next.action.updatedAt)
  );
}
