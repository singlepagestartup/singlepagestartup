import React, { useEffect } from "react";
import { useNavigate } from "react-router";

export function Root() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/ecommerce", { replace: true });
  }, [navigate]);

  return null;
}
