import { SettingsContext } from "@/components/providers/settingsProvider";
import { SkipReview } from "@/constants/settings";
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

const SkipReviewValues = [SkipReview.None, SkipReview.Correct, SkipReview.Both];

const SkipReviewLabels: Record<SkipReview, string> = {
  [SkipReview.None]: "Never",
  [SkipReview.Correct]: "Correct Only",
  [SkipReview.Both]: "Both",
};

export default function SkipReviewOnSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const [skipReviewStartIndex, setSkipReviewStartIndex] = useState(0);
  const [skipReviewCarouselApi, setSkipReviewCarouselApi] =
    useState<CarouselApi>();

  useEffect(() => {
    if (!settings) return;
    setSkipReviewStartIndex(SkipReviewValues.indexOf(settings.skipReviewOn));
  }, []);

  useEffect(() => {
    if (!skipReviewCarouselApi) return;

    skipReviewCarouselApi.on("select", (e) => {
      updateSettings("skipReviewOn", SkipReviewValues[e.selectedScrollSnap()]);
    });
  }, [skipReviewCarouselApi]);

  const description = settingDescriptions.SKIP_REVIEW_ON;

  return (
    <SettingDescriptionWrapper
      title={description.title}
      description={description.description}
      className=""
    >
      <div>
        <h2 className="text-sm">Skip Review On</h2>
        <Carousel
          setApi={setSkipReviewCarouselApi}
          opts={{ loop: true, startIndex: skipReviewStartIndex }}
          className="w-[150px]"
        >
          <CarouselContent>
            {SkipReviewValues.map((v) => (
              <CarouselItem key={v}>{SkipReviewLabels[v]}</CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious variant={"justIntonation"} />
          <CarouselNext variant={"justIntonation"} />
        </Carousel>
      </div>
    </SettingDescriptionWrapper>
  );
}
