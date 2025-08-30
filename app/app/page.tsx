"use client"

export default function Home() {
  // Helper to play a note by filename
  const playNote = (noteFile: string) => {
    const audio = new Audio(`/notes/${noteFile}`)
    audio.play()
  }

  // List of note files
  const noteFiles = [
    "A3.ogg",
    "A4.ogg",
    "Ab3.ogg",
    "Ab4.ogg",
    "B3.ogg",
    "B4.ogg",
    "Bb3.ogg",
    "Bb4.ogg",
    "C3.ogg",
    "C4.ogg",
    "C5.ogg",
    "D3.ogg",
    "D4.ogg",
    "Db3.ogg",
    "Db4.ogg",
    "E3.ogg",
    "E4.ogg",
    "Eb3.ogg",
    "Eb4.ogg",
    "F3.ogg",
    "F4.ogg",
    "G3.ogg",
    "G4.ogg",
    "Gb3.ogg",
    "Gb4.ogg",
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
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
        onClick={() => {
          // play Random note from public/notes
          const random = noteFiles[Math.floor(Math.random() * noteFiles.length)]
          playNote(random)
        }}
      >
        Play Random Note
      </button>
    </div>
  )
}
