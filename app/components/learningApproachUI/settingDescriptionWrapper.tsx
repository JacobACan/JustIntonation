import React from "react";
import { InfoIcon } from "../icon/infoIcon";
import { cn } from "@/lib/utils";

export interface SettingDescriptionWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  infoSide?: "left" | "right";
  className?: string;
}

/**
 * SettingDescriptionWrapper Component
 *
 * A wrapper component that combines a setting component with an info icon
 * that displays the setting's description. This provides a consistent pattern
 * for adding descriptions to all settings throughout the app.
 *
 * Usage:
 * ```tsx
 * <SettingDescriptionWrapper
 *   title="Learning Mode"
 *   description="Choose between 3 modes which are what you will be actively guessing on the piano."
 * >
 *   <YourSettingComponent />
 * </SettingDescriptionWrapper>
 * ```
 */
export const SettingDescriptionWrapper = ({
  title,
  description,
  children,
  infoSide = "right",
  className,
}: SettingDescriptionWrapperProps) => {
  return (
    <div className="flex items-start gap-2">
      <div className={cn("flex-1", className)}>{children}</div>
      <div className="pt-1 leading-0">
        <InfoIcon
          title={title}
          description={description}
          side={infoSide}
          className="transition-opacity hover:opacity-70"
        />
      </div>
    </div>
  );
};
