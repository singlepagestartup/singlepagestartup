import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

export function CatchAllRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect any unmatched path to /admin + that path
    navigate(`/admin${location.pathname}`, { replace: true });
  }, [navigate, location.pathname]);

  return null;
}
