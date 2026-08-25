import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShakeDetector, ShakeSensitivity } from "@/hooks/useShakeDetector";
import { Smartphone, Zap, Vibrate, Check, ShieldAlert, Sparkles } from "lucide-react";

export const ShakeSettingsCard = () => {
  const {
    config,
    updateConfig,
    isSupported,
    needsPermission,
    permissionGranted,
    requestPermission,
    simulateShake,
  } = useShakeDetector();

  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
  };

  return (
    <Card className="border-border bg-card/90 shadow-md backdrop-blur-xl dark:bg-slate-950/80 dark:border-white/10 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 dark:bg-violet-500/20">
              <Smartphone className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Shake to Quick-Add
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] px-2 py-0.5">
                  Pro Feature
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Shake your mobile phone while using the app to quickly add a transaction.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 text-foreground">
        {/* iOS Permission Notice */}
        {needsPermission && permissionGranted !== true && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
              <span>iOS Motion Access Needed</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Apple Safari requires explicit permission to access mobile motion sensors.
            </p>
            <Button
              size="sm"
              onClick={handleRequestPermission}
              disabled={requesting}
              className="w-full h-8 text-xs bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              {requesting ? "Requesting..." : "Grant Motion Permission"}
            </Button>
          </div>
        )}

        {/* Enable / Disable Switch */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="space-y-0.5">
            <Label htmlFor="shake-enabled" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Enable Shake Gesture
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Detect physical phone shakes to open transaction modal
            </p>
          </div>
          <Switch
            id="shake-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => updateConfig({ enabled: checked })}
          />
        </div>

        {config.enabled && (
          <>
            {/* Sensitivity Levels */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                Shake Sensitivity
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as ShakeSensitivity[]).map((level) => {
                  const isSelected = config.sensitivity === level;
                  const labels: Record<ShakeSensitivity, { title: string; desc: string }> = {
                    low: { title: "Firm", desc: "Hard Shake" },
                    medium: { title: "Medium", desc: "Standard" },
                    high: { title: "Sensitive", desc: "Light Shake" },
                  };

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateConfig({ sensitivity: level })}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                        isSelected
                          ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium shadow-sm"
                          : "border-border bg-muted/20 hover:bg-muted/50 text-muted-foreground dark:border-white/5"
                      }`}
                    >
                      <span className="text-xs font-semibold flex items-center gap-1">
                        {labels[level].title}
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="text-[10px] opacity-75 mt-0.5">{labels[level].desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Haptics Switch */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 dark:border-white/5 dark:bg-white/5">
              <div className="space-y-0.5">
                <Label htmlFor="haptics-enabled" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <Vibrate className="h-3.5 w-3.5 text-violet-500" />
                  Haptic Vibration Feedback
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Vibrate phone when a shake gesture is registered
                </p>
              </div>
              <Switch
                id="haptics-enabled"
                checked={config.hapticsEnabled}
                onCheckedChange={(checked) => updateConfig({ hapticsEnabled: checked })}
              />
            </div>

            {/* Test Shake Button */}
            <Button
              type="button"
              variant="outline"
              onClick={simulateShake}
              className="w-full h-9 text-xs border-dashed border-violet-500/40 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400 dark:border-violet-400/30"
            >
              <Smartphone className="h-3.5 w-3.5 mr-2" />
              Test Shake Gesture 📱💥
            </Button>
          </>
        )}

        <p className="text-[10px] text-muted-foreground text-center italic pt-1">
          Note: Shake gesture works while the app is active in your mobile browser or installed PWA.
        </p>
      </CardContent>
    </Card>
  );
};
