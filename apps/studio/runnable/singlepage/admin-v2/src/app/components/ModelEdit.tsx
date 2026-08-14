import { useParams, useNavigate } from "react-router";
import { EntityDrawer } from "./EntityDrawer";

export function ModelEdit() {
  const { moduleSlug, modelSlug, id } = useParams();
  const navigate = useNavigate();

  if (!moduleSlug || !modelSlug || !id) return null;

  return (
    <EntityDrawer
      moduleSlug={moduleSlug}
      modelSlug={modelSlug}
      recordId={id}
      level={0}
      onClose={() => navigate(`/admin/${moduleSlug}/${modelSlug}`)}
    />
  );
}
