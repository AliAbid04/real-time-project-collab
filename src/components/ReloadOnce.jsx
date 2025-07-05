import { useEffect } from "react";

const ReloadOnce = ({ children }) => {
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem("reloadedRealtimePage");
    if (!hasReloaded) {
      sessionStorage.setItem("reloadedRealtimePage", "true");
      window.location.reload();
    }
  }, []);

  return children;
};

export default ReloadOnce;
