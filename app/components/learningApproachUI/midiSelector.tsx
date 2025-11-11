import React, { useContext, useEffect, useState } from "react";
import { useMIDIInputs, useMIDINotes } from "@react-midi/hooks";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import LearningUserEvent from "../learn/learningUserEvent";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import PlayIcon from "../icon/playIcon";
import Piano from "../learn/piano";
import { midiToNote } from "@/constants/notes";
import { SettingsContext } from "../providers/settingsProvider";

export const MidiSelector = () => {
  const { inputs, selectInput, input } = useMIDIInputs();
  const [midiDeviceCarouselApi, setMidiDeviceCarouselApi] =
    useState<CarouselApi>();
  const notes = useMIDINotes();
  const [midiDeviceVerified, setMidiDeviceVerified] = useState(false);
  const [midiDeviceStartIndex, setMidiDeviceStartIndex] = useState(0);
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    if (!midiDeviceCarouselApi) return;
    if (!inputs || inputs.length == 0) return;
    if (!setMidiDeviceVerified) return;

    console.log(midiDeviceCarouselApi);
    midiDeviceCarouselApi.on("select", (e) => {
      if (
        e.selectedScrollSnap() > 0 &&
        e.selectedScrollSnap() - 1 < inputs.length
      ) {
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
    if (notes.length > 0) setMidiDeviceVerified(true);
  }, [notes]);

  useEffect(() => {
    if (inputs.length == 0 || !input) return;

    setMidiDeviceStartIndex(inputs.indexOf(input) + 1);
    setMidiDeviceVerified(true);
  }, []);

  return (
    <>
      <Carousel
        setApi={setMidiDeviceCarouselApi}
        opts={{
          loop: true,
          startIndex: midiDeviceStartIndex,
        }}
        className="w-[150px] text-sm"
      >
        <CarouselContent>
          <CarouselItem className="content-center">No Midi Device</CarouselItem>
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
        <p className="text-destructive mt-2 text-sm">
          Test your midi device before starting!
        </p>
      ) : (
        <p className="text-background mt-2 text-sm">Midi Device</p>
      )}
      <section className="absolute h-[305.5px] w-[500px] content-center drop-shadow-lg">
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
        notesDown1={notes.map((n) => midiToNote[n.note])}
        displayRange={[settings.questionRange[0], settings.questionRange[1]]}
        className="mt-2"
      ></Piano>
    </>
  );
};
