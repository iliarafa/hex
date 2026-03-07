import { createAudioPlayer, AudioPlayer } from "expo-audio";

const soundFiles = {
  lift: require("../../assets/sounds/lift.wav"),
  place: require("../../assets/sounds/place.wav"),
  rowComplete: require("../../assets/sounds/row-complete.wav"),
  solved: require("../../assets/sounds/solved.wav"),
};

type SoundName = keyof typeof soundFiles;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

function getPlayer(name: SoundName): AudioPlayer {
  if (!players[name]) {
    players[name] = createAudioPlayer(soundFiles[name]);
  }
  return players[name]!;
}

export function playSound(name: SoundName) {
  try {
    const player = getPlayer(name);
    player.seekTo(0);
    player.play();
  } catch {
    // Silently fail — sounds are non-critical
  }
}
