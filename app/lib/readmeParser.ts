/**
 * README and extracts content chunks for display
 */

export interface ContentChunk {
  title: string;
  content: string;
}
export function getContent(): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // Start with the main title and tagline
  chunks.push({
    title: "JustIntonation",
    content: "Play what you hear on the piano with relative pitch.",
  });

  // Overview section
  chunks.push({
    title: "Overview",
    content:
      "Just Intonation is a piano based ear training application that helps musicians develop relative pitch on piano.",
  });

  chunks.push({
    title: "How it works",
    content:
      "By practicing in the context of a musical center (tonal reference), you'll develop the ability to identify scale degrees.",
  });

  chunks.push({
    title: "Your Journey",
    content:
      "With dedication, and the combination of interval, quality and scale degree recognition you can learn how to directly translate these aspects to the piano in real time.",
  });

  // Why Just Intonation
  chunks.push({
    title: "Why Just Intonation?",
    content:
      "Scale Degree, Melodic and Chord recognition form the foundation of creative, expressive musicianship.",
  });

  chunks.push({
    title: "Accurate Relative Pitch",
    content:
      "Learn to hear and identify notes, chords, and melodies with precision.",
  });

  chunks.push({
    title: "Direct Muscle Memory",
    content:
      "Connect what you hear directly to finger positions on your keyboard.",
  });

  chunks.push({
    title: "Musical Context",
    content: "Practice within different keys, scales, and harmonic contexts.",
  });

  chunks.push({
    title: "Progressive Learning",
    content:
      "Start with individual notes, advance to melodies and then chords.",
  });

  // Three Learning Modes
  chunks.push({
    title: "🎵 Notes",
    content:
      "Build your foundation by identifying individual notes in different keys and ranges.",
  });

  chunks.push({
    title: "🎶 Melodies",
    content:
      "Master melodic sequences and develop the ability to follow longer musical phrases.",
  });

  chunks.push({
    title: "🎼 Chords",
    content:
      "Challenge yourself with chord recognition and harmonic understanding.",
  });

  // Key Features
  chunks.push({
    title: "Instant Feedback",
    content: "Get immediate feedback on your answers.",
  });

  chunks.push({
    title: "Customizable",
    content: "Adjust range, mode, and musical context to match your level.",
  });

  chunks.push({
    title: "Accessible",
    content: "No installation needed. Works directly in your browser.",
  });

  chunks.push({
    title: "User Friendly",
    content:
      "Info icons and descriptions help beginners understand each setting.",
  });

  // Mission
  chunks.push({
    title: "Our Mission",
    content:
      "Provide musicians with focused, effective ear training that connects auditory feedback directly to kinesthetic memory on the keyboard.",
  });

  return chunks;
}
