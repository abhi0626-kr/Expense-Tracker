import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export type ShakeSensitivity = "low" | "medium" | "high";

export interface ShakeConfig {
  enabled: boolean;
  sensitivity: ShakeSensitivity;
  hapticsEnabled: boolean;
}

const STORAGE_KEY = "expense-tracker:shake-config";

const SENSITIVITY_THRESHOLDS: Record<ShakeSensitivity, number> = {
  high: 12,   // Light shake
  medium: 17, // Standard firm shake
  low: 24,    // Hard shake
};

const DEFAULT_CONFIG: ShakeConfig = {
  enabled: true,
  sensitivity: "medium",
  hapticsEnabled: true,
};

export const getShakeConfig = (): ShakeConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error("Error loading shake config:", error);
  }
  return DEFAULT_CONFIG;
};

export const saveShakeConfig = (config: ShakeConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("shake-config-changed", { detail: config }));
  } catch (error) {
    console.error("Error saving shake config:", error);
  }
};

export interface UseShakeDetectorOptions {
  onShake?: () => void;
  disabled?: boolean;
}

export const useShakeDetector = (options: UseShakeDetectorOptions = {}) => {
  const { onShake, disabled = false } = options;
  const { toast } = useToast();
  
  const [config, setConfigState] = useState<ShakeConfig>(getShakeConfig);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [lastShakeTime, setLastShakeTime] = useState<number | null>(null);

  const lastTimeRef = useRef<number>(Date.now());
  const lastXRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const lastZRef = useRef<number | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const shakeCountRef = useRef<number>(0);
  const shakeWindowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync config when updated from anywhere in app
  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<ShakeConfig>;
      if (customEvent.detail) {
        setConfigState(customEvent.detail);
      }
    };
    window.addEventListener("shake-config-changed", handleConfigChange);
    return () => window.removeEventListener("shake-config-changed", handleConfigChange);
  }, []);

  // Check if DeviceMotionEvent is supported and if permission is needed (iOS 13+)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasDeviceMotion = "DeviceMotionEvent" in window;
    setIsSupported(hasDeviceMotion);

    if (hasDeviceMotion) {
      const DeviceMotionEventTyped = DeviceMotionEvent as any;
      if (typeof DeviceMotionEventTyped.requestPermission === "function") {
        setNeedsPermission(true);
        // Check if permission was already granted previously
        const storedPermission = localStorage.getItem("expense-tracker:motion-permission");
        if (storedPermission === "granted") {
          setPermissionGranted(true);
        } else if (storedPermission === "denied") {
          setPermissionGranted(false);
        }
      } else {
        // Android / non-iOS standard motion support
        setNeedsPermission(false);
        setPermissionGranted(true);
      }
    }
  }, []);

  const triggerHaptic = useCallback(() => {
    if (config.hapticsEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch (err) {
        // Ignore haptic errors on unsupported platforms
      }
    }
  }, [config.hapticsEnabled]);

  const handleShakeTriggered = useCallback(() => {
    const now = Date.now();
    // Cooldown check: 1000ms minimum between shake triggers
    if (now - lastTriggerTimeRef.current < 1000) {
      return;
    }
    lastTriggerTimeRef.current = now;
    setLastShakeTime(now);

    triggerHaptic();

    if (onShake) {
      onShake();
    } else {
      // Global window event so any component can listen
      window.dispatchEvent(new CustomEvent("device-shaken"));
    }
  }, [onShake, triggerHaptic]);

  const updateConfig = useCallback((newPartialConfig: Partial<ShakeConfig>) => {
    const updated = { ...config, ...newPartialConfig };
    setConfigState(updated);
    saveShakeConfig(updated);
  }, [config]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const DeviceMotionEventTyped = DeviceMotionEvent as any;
    if (typeof DeviceMotionEventTyped?.requestPermission === "function") {
      try {
        const state = await DeviceMotionEventTyped.requestPermission();
        if (state === "granted") {
          setPermissionGranted(true);
          localStorage.setItem("expense-tracker:motion-permission", "granted");
          toast({
            title: "Motion Access Granted",
            description: "Shake gesture is now active! Try shaking your device.",
          });
          return true;
        } else {
          setPermissionGranted(false);
          localStorage.setItem("expense-tracker:motion-permission", "denied");
          toast({
            title: "Motion Access Denied",
            description: "Motion permission is required to detect shake gestures.",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: any) {
        console.error("Error requesting motion permission:", error);
        toast({
          title: "Permission Error",
          description: error.message || "Failed to request motion permission.",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  }, [toast]);

  // Motion event listener
  useEffect(() => {
    if (!config.enabled || disabled || !isSupported || permissionGranted === false) {
      return;
    }

    const threshold = SENSITIVITY_THRESHOLDS[config.sensitivity];

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const now = Date.now();
      const timeDiff = now - lastTimeRef.current;
      
      // Throttle processing to every ~50ms
      if (timeDiff < 50) return;
      lastTimeRef.current = now;

      // Prefer acceleration without gravity if present, fallback to accelerationIncludingGravity
      let acc = event.acceleration;
      if (!acc || (acc.x === null && acc.y === null && acc.z === null)) {
        acc = event.accelerationIncludingGravity;
      }

      if (!acc || acc.x === null || acc.y === null || acc.z === null) {
        return;
      }

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;

      if (lastXRef.current !== null && lastYRef.current !== null && lastZRef.current !== null) {
        const deltaX = Math.abs(x - lastXRef.current);
        const deltaY = Math.abs(y - lastYRef.current);
        const deltaZ = Math.abs(z - lastZRef.current);

        // Vector magnitude of change
        const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

        if (speed > threshold) {
          shakeCountRef.current += 1;

          if (shakeWindowTimerRef.current) {
            clearTimeout(shakeWindowTimerRef.current);
          }

          // Reset shake count if quiet for 700ms
          shakeWindowTimerRef.current = setTimeout(() => {
            shakeCountRef.current = 0;
          }, 700);

          // Requires at least 2 rapid direction changes to confirm a intentional shake
          if (shakeCountRef.current >= 2) {
            shakeCountRef.current = 0;
            if (shakeWindowTimerRef.current) {
              clearTimeout(shakeWindowTimerRef.current);
            }
            handleShakeTriggered();
          }
        }
      }

      lastXRef.current = x;
      lastYRef.current = y;
      lastZRef.current = z;
    };

    window.addEventListener("devicemotion", handleDeviceMotion, true);

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion, true);
      if (shakeWindowTimerRef.current) {
        clearTimeout(shakeWindowTimerRef.current);
      }
    };
  }, [config.enabled, config.sensitivity, disabled, isSupported, permissionGranted, handleShakeTriggered]);

  const simulateShake = useCallback(() => {
    toast({
      title: "Shake Triggered! 📱💥",
      description: "Shake gesture detected. Opening Add Transaction...",
    });
    handleShakeTriggered();
  }, [handleShakeTriggered, toast]);

  return {
    config,
    updateConfig,
    isSupported,
    needsPermission,
    permissionGranted,
    requestPermission,
    simulateShake,
    lastShakeTime,
  };
};
