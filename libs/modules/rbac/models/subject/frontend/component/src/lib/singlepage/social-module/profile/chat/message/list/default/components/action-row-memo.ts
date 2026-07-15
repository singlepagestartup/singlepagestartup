export interface IActionRowMemoProps {
  action: {
    id: string;
    updatedAt: string | Date;
  };
  language: string;
}

export function areActionRowPropsEqual(
  previous: IActionRowMemoProps,
  next: IActionRowMemoProps,
) {
  return (
    previous.language === next.language &&
    previous.action.id === next.action.id &&
    String(previous.action.updatedAt) === String(next.action.updatedAt)
  );
}
