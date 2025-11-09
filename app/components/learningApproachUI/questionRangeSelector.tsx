import { useContext, useEffect, useRef } from "react";
import { SettingsContext } from "../providers/settingsProvider";
import { midiToNote, Note, WHITE_NOTES } from "../../constants/notes";
import Piano from "../learn/piano";
import { useMIDINotes } from "@react-midi/hooks";

export default function QuestionNoteRangeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const notes = useMIDINotes();

  const selectionRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef(0);
  const selectionDragStart = useRef(0);
  const leftBlurBoxRef = useRef<HTMLDivElement | null>(null);
  const rightBlurBoxRef = useRef<HTMLDivElement | null>(null);

  const selectionRangeLeft = useRef(0);

  const SELECTION_RANGE_WIDTH = 400;
  const NUM_WHITE_KEYS_ON_FULL_PIANO = 52;
  const WHITE_KEY_WIDTH = SELECTION_RANGE_WIDTH / NUM_WHITE_KEYS_ON_FULL_PIANO;
  const SELECTION_RANGE_HEIGHT = WHITE_KEY_WIDTH * 5.45 + 2;

  const moveToMousePosition = (e: React.DragEvent<HTMLDivElement>) => {
    const amountToMove = e.clientX - dragStart.current;

    const amountAlreadyMoved =
      selectionDragStart.current - selectionRangeLeft.current;
    setSelecitonRange(amountToMove, amountAlreadyMoved);
  };

  const setSelecitonRange = (
    amountToMove: number,
    amountAlreadyMoved: number,
  ) => {
    // Update Visuals
    if (!selectionRef.current) return;
    if (!rightBlurBoxRef.current) return;
    if (!leftBlurBoxRef.current) return;

    const selectionWidth = selectionRef.current.getBoundingClientRect().width;

    let distanceDraggedFromStart = amountToMove + amountAlreadyMoved;
    if (distanceDraggedFromStart < 0) {
      distanceDraggedFromStart = 0;
    } else if (
      distanceDraggedFromStart >=
      SELECTION_RANGE_WIDTH - selectionWidth
    ) {
      distanceDraggedFromStart = SELECTION_RANGE_WIDTH - selectionWidth;
    }

    selectionRef.current.style.transform = `translate(${distanceDraggedFromStart}px)`;

    leftBlurBoxRef.current.style.width = `${distanceDraggedFromStart}px`;

    const rightBlurBoxStart =
      distanceDraggedFromStart +
      selectionRef.current.getBoundingClientRect().width;

    rightBlurBoxRef.current.style.transform = `translate(${rightBlurBoxStart}px)`;

    rightBlurBoxRef.current.style.width = `${SELECTION_RANGE_WIDTH - rightBlurBoxStart}px`;

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

    selectionRef.current.style.height = h;
    selectionRef.current.style.width = `${WHITE_KEY_WIDTH * 8}px`;
    selectionRangeLeft.current =
      leftBlurBoxRef.current.getBoundingClientRect().left;

    //Set selection range to start at middle C
    setSelecitonRange(WHITE_KEY_WIDTH * 7 * 3 + 2 * WHITE_KEY_WIDTH, 0);
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
        ref={leftBlurBoxRef}
        className="bg-background/70 absolute h-[44px] w-[400px] rounded-sm"
      ></div>
      <div
        ref={rightBlurBoxRef}
        className="bg-background/70 absolute h-[44px] w-[0px] rounded-sm"
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
        className="bg-primary/20 absolute h-[44px] w-[0px] cursor-pointer rounded-sm"
      ></div>
      <p className="text-sm">
        {settings.questionRange[0]} - {settings.questionRange[1]}
      </p>
    </div>
  );
}
