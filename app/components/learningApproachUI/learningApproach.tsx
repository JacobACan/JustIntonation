import React, { useContext } from "react";

import { SettingsContext } from "@/components/providers/settingsProvider";
import Piano from "../learn/piano";

export default function LearningApproach() {
  const { settings } = useContext(SettingsContext);

  return (
    <div className=" overflow-hidden">
      <section className="w-[40%] h-[100vh] left-0 absolute">
        <div className="absolute w-full h-full from-transparent via-background to-background bg-gradient-to-l "></div>
        <div className="left-0 absolute p-4">General Settings</div>
      </section>
      <section className="w-[40%] h-[100vh] right-0 absolute">
        <div className=" absolute w-full h-full from-transparent via-background to-background bg-gradient-to-r "></div>
        <div className="right-0 absolute p-4">Mode Settings</div>
      </section>
      <div className="align-middle items-center text-center  h-[100vh] content-center ">
        Learning Mode
        <Piano></Piano>
      </div>
    </div>
  );
}
