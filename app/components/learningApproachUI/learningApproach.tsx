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
import { LearningModeValues } from "@/constants/settings";
import { useMIDIInputs, useMIDINote } from "@react-midi/hooks";
import { midiToNote, Note } from "@/constants/notes";
import LearningUserEvent from "../learn/learningUserEvent";
import PlayIcon from "../icon/playIcon";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";

export default function LearningApproach() {
  const { updateSettings, settings } = useContext(SettingsContext);
  const [learningModeCarouselApi, setLearningModeCarouselApi] =
    useState<CarouselApi>();
  const { inputs, selectInput, selectedInputId, input } = useMIDIInputs();
  const [midiDeviceCarouselApi, setMidiDeviceCarouselApi] =
    useState<CarouselApi>();
  const note = useMIDINote();
  const [midiDeviceVerified, setMidiDeviceVerified] = useState(false);
  const [midiDeviceStartIndex, setMidiDeviceStartIndex] = useState(0);
  const [learningModeStartIndex, setLearningModeStartIndex] = useState(0);

  useEffect(() => {
    if (!learningModeCarouselApi) return;

    learningModeCarouselApi.on("select", (e) => {
      updateSettings(
        "learningMode",
        LearningModeValues[e.selectedScrollSnap()],
      );
    });
  }, [learningModeCarouselApi]);

  useEffect(() => {
    if (!midiDeviceCarouselApi) return;
    if (!inputs || inputs.length == 0) return;
    if (!setMidiDeviceVerified) return;
    midiDeviceCarouselApi.on("select", (e) => {
      if (e.selectedScrollSnap() > 0) {
        selectInput(inputs[e.selectedScrollSnap() - 1].id);
      }
      setMidiDeviceVerified(false);
    });
  }, [midiDeviceCarouselApi, inputs, setMidiDeviceVerified]);

  useEffect(() => {
    if (!midiDeviceCarouselApi || !input) return;
    const inputIndex = inputs.indexOf(input) + 1;
    midiDeviceCarouselApi.scrollTo(inputIndex);
  }, [inputs]);

  useEffect(() => {
    if (note && !midiDeviceVerified) setMidiDeviceVerified(true);
  }, [note]);

  useEffect(() => {
    if (inputs.length == 0 || !input) return;

    setMidiDeviceStartIndex(inputs.indexOf(input) + 1);
    setMidiDeviceVerified(true);

    if (!settings) return;
    setLearningModeStartIndex(
      LearningModeValues.indexOf(settings.learningMode),
    );
  }, []);

  const renderMainSettings = () => {
    return (
      <div className="h-lvh content-center justify-items-center text-center">
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
        <Carousel
          setApi={setMidiDeviceCarouselApi}
          opts={{
            loop: true,
            startIndex: midiDeviceStartIndex,
          }}
          className="w-[150px] text-sm"
        >
          <CarouselContent>
            <CarouselItem className="content-center">
              No Midi Device Selected
            </CarouselItem>
            {inputs.map((m) => (
              <CarouselItem className="content-center" key={m.id}>
                {m.name}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious variant={"justIntonnation"} />
          <CarouselNext variant={"justIntonnation"} />
        </Carousel>
        {!midiDeviceVerified ? (
          <p className="text-destructive m-2 text-lg">
            Test your midi device before starting!
          </p>
        ) : (
          <p className="m-2 text-lg">All good to start learning!</p>
        )}
        <section className="absolute h-[350px] w-[500px] content-center drop-shadow-lg">
          {midiDeviceVerified && (
            <LearningUserEvent
              className="m-auto"
              eventType={MusicLearnerEvent.START}
            >
              <PlayIcon width={150} height={150} />
            </LearningUserEvent>
          )}
        </section>
        <Piano
          notesDown1={note && note.on ? [midiToNote[note.note]] : []}
          displayRange={[Note.C4, Note.C5]}
          width={500}
        ></Piano>
      </div>
    );
  };

  return (
    <div className="overflow-hidden">
      <section className="pointer-events-none absolute left-0 h-[100vh] w-[40%]">
        <div className="via-background to-background pointer-events-none absolute h-full w-full bg-gradient-to-l from-transparent"></div>
        <div className="absolute left-0 p-4">General Settings</div>
      </section>
      <section className="pointer-events-none absolute right-0 h-[100vh] w-[40%]">
        <div className="via-background to-background pointer-events-none absolute h-full w-full bg-gradient-to-r from-transparent"></div>
        <div className="absolute right-0 p-4">Mode Settings</div>
      </section>
      {renderMainSettings()}
    </div>
  );
}
