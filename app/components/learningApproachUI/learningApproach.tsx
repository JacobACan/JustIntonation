import React, { useContext, useEffect, useState } from "react";

import { SettingsContext } from "@/components/providers/settingsProvider";
import Piano from "../learn/piano";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { LearningMode, LearningModeValues } from "@/constants/settings";
import useEmblaCarousel from "embla-carousel-react";

export default function LearningApproach() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    api.on("select", (e) => {
      updateSettings(
        "learningMode",
        LearningModeValues[e.selectedScrollSnap()]
      );
    });
  }, [api]);

  const renderMainSettings = () => {
    return (
      <div className="align-middle items-center text-center  h-[100vh] content-center place-items-center">
        <h1 className="text-sm">Learning Mode</h1>
        <Carousel setApi={setApi} opts={{ loop: true }} className=" w-[150px] ">
          <CarouselContent>
            {LearningModeValues.map((m) => (
              <CarouselItem key={m}>{m}</CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious variant={"justIntonnation"} />
          <CarouselNext variant={"justIntonnation"} />
        </Carousel>
        <Piano></Piano>
      </div>
    );
  };

  return (
    <div className=" overflow-hidden">
      <section className="w-[40%] h-[100vh] left-0 absolute">
        <div className="absolute w-full h-full from-transparent via-background to-background bg-gradient-to-l "></div>
        <div className="left-0 absolute p-4">General Settings</div>
      </section>
      <section className="w-[40%] h-[100vh] right-0 absolute">
        <div className="absolute w-full h-full from-transparent via-background to-background bg-gradient-to-r "></div>
        <div className="right-0 absolute p-4">Mode Settings</div>
      </section>
      {renderMainSettings()}
    </div>
  );
}
