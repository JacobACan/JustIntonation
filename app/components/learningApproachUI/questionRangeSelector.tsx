import { useContext, useEffect, useRef, useState } from "react";
import { SettingsContext } from "../providers/settingsProvider";
import { midiToNote, Note, WHITE_NOTES } from "../../constants/notes";
import Piano from "../learn/piano";
import { useMIDINotes } from "@react-midi/hooks";

export default function QuestionNoteRangeSelector() {
  const SELECTION_RANGE_WIDTH = 400;
  const NUM_WHITE_KEYS_ON_FULL_PIANO = 52;
  const WHITE_KEY_WIDTH = SELECTION_RANGE_WIDTH / NUM_WHITE_KEYS_ON_FULL_PIANO;
  const SELECTION_RANGE_HEIGHT = WHITE_KEY_WIDTH * 5.45 + 2;
  const MIDDLE_C_PX = WHITE_KEY_WIDTH * 7 * 3 + 2 * WHITE_KEY_WIDTH;

  const { settings, updateSettings } = useContext(SettingsContext);
  const notes = useMIDINotes();

  const selectionRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef(0);
  const selectionDragStart = useRef(0);
  const slctnCenterLeft = useRef(MIDDLE_C_PX);

  const leftBlurBoxRef = useRef<HTMLDivElement | null>(null);
  const rightBlurBoxRef = useRef<HTMLDivElement | null>(null);

  const leftRangeSelectorRef = useRef<HTMLDivElement | null>(null);
  const rightRangeSelectorRef = useRef<HTMLDivElement | null>(null);

  const selectionRangeLeft = useRef(0);

  const lRangeOffsetPx = useRef(0);
  const lRangeOffsetStartPx = useRef(0);
  const rRangeOffsetPx = useRef(0);
  const rRangeOffsetStartPx = useRef(0);

  const moveToMousePosition = (e: React.DragEvent<HTMLDivElement>) => {
    const amountToMove = e.clientX - dragStart.current;

    const mouseOffset =
      selectionDragStart.current -
      selectionRangeLeft.current -
      lRangeOffsetPx.current;
    setSelecitonRange(amountToMove, mouseOffset);
  };

  const setSelecitonRange = (amountToMove: number, offset: number) => {
    // Update Visuals
    if (!selectionRef.current) return;
    if (!rightBlurBoxRef.current) return;
    if (!leftBlurBoxRef.current) return;
    if (!leftRangeSelectorRef.current) return;
    if (!leftRangeSelectorRef.current || !rightRangeSelectorRef.current) return;

    const selectionWidth = WHITE_KEY_WIDTH * 8;

    let selectionCenterLeft = amountToMove + offset;
    if (selectionCenterLeft + lRangeOffsetPx.current < 0) {
      selectionCenterLeft = 0 - lRangeOffsetPx.current;
    } else if (
      selectionCenterLeft + selectionWidth + rRangeOffsetPx.current >=
      SELECTION_RANGE_WIDTH
    ) {
      selectionCenterLeft =
        SELECTION_RANGE_WIDTH - selectionWidth - rRangeOffsetPx.current;
    }
    slctnCenterLeft.current = selectionCenterLeft;

    selectionRef.current.style.transform = `translate(${selectionCenterLeft + lRangeOffsetPx.current}px)`;
    selectionRef.current.style.width = `${selectionWidth - lRangeOffsetPx.current + rRangeOffsetPx.current}px`;

    leftBlurBoxRef.current.style.width = `${selectionCenterLeft + lRangeOffsetPx.current}px`;

    const rightBlurBoxStart =
      selectionCenterLeft + selectionWidth + rRangeOffsetPx.current;

    rightBlurBoxRef.current.style.transform = `translate(${rightBlurBoxStart}px)`;

    rightBlurBoxRef.current.style.width = `${SELECTION_RANGE_WIDTH - rightBlurBoxStart}px`;

    leftRangeSelectorRef.current.style.width = `${selectionCenterLeft}px`;
    rightRangeSelectorRef.current.style.width = `${SELECTION_RANGE_WIDTH - rightBlurBoxStart}px`;

    // Update Settings
    const selectionRangeBoundingBox =
      selectionRef.current.getBoundingClientRect();
    const rangeStart =
      selectionRangeBoundingBox.left - selectionRangeLeft.current;
    const rangeEnd =
      selectionRangeBoundingBox.right -
      selectionRangeLeft.current -
      WHITE_KEY_WIDTH;
    updateSettings("questionRange", [
      noteForRange(rangeStart),
      noteForRange(rangeEnd),
    ]);
  };

  const noteForRange = (pxFromSelectionStart: number): Note => {
    const numWhiteKeysFromStart = Math.round(
      pxFromSelectionStart / WHITE_KEY_WIDTH,
    );
    const res = WHITE_NOTES[numWhiteKeysFromStart];
    return res;
  };

  useEffect(() => {
    window.addEventListener("resize", () => {
      if (!leftBlurBoxRef.current) return;
      selectionRangeLeft.current =
        leftBlurBoxRef.current.getBoundingClientRect().left;
    });

    if (
      !selectionRef.current ||
      !leftBlurBoxRef.current ||
      !rightBlurBoxRef.current
    )
      return;
    const h = `${SELECTION_RANGE_HEIGHT.toFixed()}px`;
    leftBlurBoxRef.current.style.height = h;
    rightBlurBoxRef.current.style.height = h;

    selectionRef.current.style.width = `${WHITE_KEY_WIDTH * 8}px`;
    selectionRangeLeft.current =
      leftBlurBoxRef.current.getBoundingClientRect().left;

    setSelecitonRange(slctnCenterLeft.current, 0);
  }, []);

  return (
    <div className="grid w-fit pr-[30%] pl-[30%]">
      <Piano
        width={SELECTION_RANGE_WIDTH}
        displayRange={[Note.A0, Note.C8]}
        notesDown1={notes.map((n) => midiToNote[n.note])}
        className="rounded-sm"
      ></Piano>
      <div
        draggable
        ref={leftBlurBoxRef}
        className="bg-background/70 absolute h-[44px] w-[400px] cursor-col-resize rounded-sm"
        onDragStart={(e) => {
          dragStart.current = e.clientX;
          e.dataTransfer.setDragImage(new Image(), 0, 0);
          lRangeOffsetStartPx.current = lRangeOffsetPx.current;
        }}
        onDrag={(e) => {
          if (!selectionRef.current) return;
          const newOffset =
            lRangeOffsetStartPx.current + e.clientX - dragStart.current;
          lRangeOffsetPx.current = newOffset > 0 ? 0 : newOffset;
          setSelecitonRange(slctnCenterLeft.current, 0);
        }}
      ></div>
      <div
        draggable
        ref={rightBlurBoxRef}
        className="bg-background/70 absolute h-[44px] w-[0px] cursor-col-resize rounded-sm"
        onDragStart={(e) => {
          dragStart.current = e.clientX;
          e.dataTransfer.setDragImage(new Image(), 0, 0);
          rRangeOffsetStartPx.current = rRangeOffsetPx.current;
        }}
        onDrag={(e) => {
          if (!selectionRef.current) return;
          const newOffset =
            rRangeOffsetStartPx.current + e.clientX - dragStart.current;
          rRangeOffsetPx.current = newOffset < 0 ? 0 : newOffset;
          setSelecitonRange(slctnCenterLeft.current, 0);
        }}
      ></div>
      <div
        draggable
        ref={selectionRef}
        onDrag={(e) => moveToMousePosition(e)}
        onDragStart={(e) => {
          dragStart.current = e.clientX;

          e.dataTransfer.setDragImage(new Image(), 0, 0);
          if (!selectionRef.current) return;
          selectionDragStart.current =
            selectionRef.current.getBoundingClientRect().x;
        }}
        className="absolute h-[64px] w-[0px] cursor-pointer rounded-sm"
      ></div>
      <div className="flex">
        <div ref={leftRangeSelectorRef} className={`w-[174px]`}></div>
        <p className="w-fit pr-[6px] pl-[6px] text-sm">
          {settings.questionRange[0]} - {settings.questionRange[1]}
        </p>
        <div ref={rightRangeSelectorRef}></div>
      </div>
    </div>
  );
}
