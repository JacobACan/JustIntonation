import { SettingsContext } from "@/components/providers/settingsProvider";
import { LearningModeValues } from "@/constants/settings";
import { useContext, useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export default function LearningModeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [learningModeStartIndex, setLearningModeStartIndex] = useState(0);
  const [learningModeCarouselApi, setLearningModeCarouselApi] =
    useState<CarouselApi>();

  useEffect(() => {
    if (!settings) return;
    setLearningModeStartIndex(
      LearningModeValues.indexOf(settings.learningMode),
    );
  }, []);

  useEffect(() => {
    if (!learningModeCarouselApi) return;

    learningModeCarouselApi.on("select", (e) => {
      updateSettings(
        "learningMode",
        LearningModeValues[e.selectedScrollSnap()],
      );
    });
  }, [learningModeCarouselApi]);

  const description = settingDescriptions.LEARNING_MODE_SELECTOR;

  return (
    <SettingDescriptionWrapper
      title={description.title}
      description={description.description}
      className="pl-[28px]"
    >
      <div>
        <h1 className="text-sm">Learning Mode</h1>
        <Carousel
          setApi={setLearningModeCarouselApi}
          opts={{ loop: true, startIndex: learningModeStartIndex }}
          className="w-[150px]"
        >
          <CarouselContent>
            {LearningModeValues.map((m) => (
              <CarouselItem key={m}>{m}</CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious variant={"justIntonnation"} />
          <CarouselNext variant={"justIntonnation"} />
        </Carousel>
      </div>
    </SettingDescriptionWrapper>
  );
}
