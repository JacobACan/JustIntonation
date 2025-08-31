"use client"

import { MIDIProvider } from "@react-midi/hooks"
import { MidiSelector } from "./components/midi"
import Piano from "./components/piano"
import { midiToNote, Note, noteFilesArray, noteFilesToNotes } from "./constants/notes"
import { useState } from "react"

export default function Home() {


  // Helper to play a note by filename
  const playNote = (noteFile: string) => {
    const audio = new Audio(`/notes/${noteFile}`)
    audio.play()
  } 

  //currentNote usestate var
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [questionNote, setQuestionNote] = useState<Note | null>(null)

  const getNextQuestionNote = () => {
    // play Random note from public/notes
    
    const random = noteFilesArray[Math.floor(Math.random() * noteFilesArray.length)]
    playNote(random)
    setQuestionNote(noteFilesToNotes[random]||null)
  }


  return (
    <MIDIProvider>

      <div className="flex flex-col items-center justify-center min-h-screen py-2 font-sans">
        <button
          className="mb-4"
          onClick={() => {
            // play C3 from public/notes
            playNote("C3.ogg")
          }}
        >
          Play Cadence
        </button>
        <button
        className="mb-4"
          onClick={() => {
            // play Random note from public/notes
            
            const random = noteFilesArray[Math.floor(Math.random() * noteFilesArray.length)]
            playNote(random)
            setQuestionNote(noteFilesToNotes[random]||null)
          }}
        >
          Play Random Note
        </button>
        <Piano 
          displayRange={[Note.C3, Note.C5]}
          notesDown1={[...(currentNote ? [currentNote] : [])]}
          notesDown2={[...(questionNote ? [questionNote] : [])]}
          width={500}
        />
        <MidiSelector
          onNotesChange={(notes) => {
            // Play the first note in the list
            if (notes.length > 0) {
              const note = notes[0]
              const notePlayed = midiToNote[note.note]
              setCurrentNote(notePlayed)
              console.log("\nPlaying note:", notePlayed)
              console.log("Question note:", questionNote)
              if (notePlayed === questionNote) {
                console.log("Correct!")
                getNextQuestionNote()
              }

            }
          }
          }
        />
      </div>
    </MIDIProvider>
  )
}
