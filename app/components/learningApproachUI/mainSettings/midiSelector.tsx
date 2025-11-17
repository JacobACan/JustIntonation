import React, { useContext, useEffect, useState } from "react";
import { useMIDIInputs, useMIDINotes } from "@react-midi/hooks";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel";
import LearningUserEvent from "../../learn/learningUserEvent";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import PlayIcon from "../../icon/playIcon";
import Piano from "../../learn/piano";
import { midiToNote } from "@/constants/notes";
import { SettingsContext } from "../../providers/settingsProvider";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export const MidiSelector = () => {
  const { inputs, selectInput, input } = useMIDIInputs();
  const [midiDeviceCarouselApi, setMidiDeviceCarouselApi] =
    useState<CarouselApi>();
  const notes = useMIDINotes();
  const [midiDeviceVerified, setMidiDeviceVerified] = useState(false);
  const [midiDeviceStartIndex, setMidiDeviceStartIndex] = useState(0);
  const [inputsInitialized, setInputsInitialized] = useState(false);
  const { settings, updateSettings } = useContext(SettingsContext);

  useEffect(() => {
    if (!midiDeviceCarouselApi) return;
    if (!inputs || inputs.length == 0) return;
    if (!setMidiDeviceVerified) return;

    midiDeviceCarouselApi.on("select", (e) => {
      if (
        e.selectedScrollSnap() > 0 &&
        e.selectedScrollSnap() - 1 < inputs.length
      ) {
        selectInput(inputs[e.selectedScrollSnap() - 1].id);
        const deviceVerified = settings.midiDevices[
          inputs[e.selectedScrollSnap() - 1].id
        ]
          ? settings.midiDevices[inputs[e.selectedScrollSnap() - 1].id].verified
          : false;
        updateSettings("midiDevices", {
          ...settings.midiDevices,
          [inputs[e.selectedScrollSnap() - 1].id]: {
            verified: deviceVerified,
            id: inputs[e.selectedScrollSnap() - 1].id,
          },
        });
        setMidiDeviceVerified(deviceVerified);
      } else {
        setMidiDeviceVerified(false);
      }
    });
  }, [midiDeviceCarouselApi, inputs, setMidiDeviceVerified]);

  useEffect(() => {
    if (!midiDeviceCarouselApi || !input) return;
    const inputIndex = inputs.indexOf(input) + 1;
    midiDeviceCarouselApi.scrollTo(inputIndex);
  }, [inputs]);

  useEffect(() => {
    if (notes.length > 0) {
      setMidiDeviceVerified(true);
      updateSettings("midiDevices", {
        ...settings.midiDevices,
        [input?.id || ""]: {
          verified: true,
          id: input?.id || "",
        },
      });
    }
  }, [notes]);

  useEffect(() => {
    if (inputs.length == 0 || !input) return;

    setMidiDeviceStartIndex(inputs.indexOf(input) + 1);
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (inputs.length == 0) return;
    if (inputsInitialized) return;

    const deviceIndexFirstVerifiedDevice =
      inputs.findIndex((i) =>
        settings.midiDevices[i.id]
          ? settings.midiDevices[i.id].verified
          : false,
      ) + 1;
    midiDeviceCarouselApi?.scrollTo(deviceIndexFirstVerifiedDevice);

    const idOfIndexScrolledTo =
      deviceIndexFirstVerifiedDevice > 0
        ? inputs[deviceIndexFirstVerifiedDevice - 1].id
        : "";

    setMidiDeviceVerified(
      settings.midiDevices[idOfIndexScrolledTo]
        ? settings.midiDevices[idOfIndexScrolledTo].verified
        : false,
    );
    setInputsInitialized(true);
  }, [inputs, settings]);

  const description = settingDescriptions.MIDI_DEVICE_SELECTOR;

  return (
    <>
      <SettingDescriptionWrapper
        title={description.title}
        description={description.description}
        className="w-80 justify-items-center pl-[28px]"
      >
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
              No Midi Device
            </CarouselItem>
            {inputs.map((m) => (
              <CarouselItem className="content-center" key={m.id}>
                {m.name}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious variant={"justIntonation"} />
          <CarouselNext variant={"justIntonation"} />
        </Carousel>
        {!midiDeviceVerified ? (
          <p className="text-destructive mt-2 text-sm">
            Test your midi device before starting!
          </p>
        ) : (
          <p className="text-background mt-2 text-sm">Midi Device</p>
        )}
        <section className="absolute content-center drop-shadow-lg">
          {midiDeviceVerified && (
            <LearningUserEvent
              className="m-auto mt-[73px] hover:scale-110 hover:cursor-pointer active:scale-95"
              eventType={MusicLearnerEvent.START}
            >
              <PlayIcon width={150} height={150} />
            </LearningUserEvent>
          )}
        </section>
      </SettingDescriptionWrapper>
      <Piano
        notesDown1={notes.map((n) => midiToNote[n.note])}
        displayRange={[settings.questionRange[0], settings.questionRange[1]]}
        className="mt-2"
      ></Piano>
    </>
  );
};
