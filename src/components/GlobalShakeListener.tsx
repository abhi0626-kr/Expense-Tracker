import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShakeDetector } from "@/hooks/useShakeDetector";
import { useToast } from "@/hooks/use-toast";

export const GlobalShakeListener = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useShakeDetector({
    onShake: () => {
      toast({
        title: "Shake Detected! 📱💥",
        description: "Opening Add Transaction screen...",
      });

      if (location.pathname !== "/") {
        navigate("/?add=true");
      } else {
        // If already on Dashboard (/), update URL query param or dispatch event
        const url = new URL(window.location.href);
        url.searchParams.set("add", "true");
        window.history.pushState({}, "", url.toString());
        window.dispatchEvent(new CustomEvent("open-add-transaction-modal"));
      }
    },
  });

  return null;
};
