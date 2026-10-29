import { createAudioPlayer, AudioPlayer } from "expo-audio";

const soundFiles = {
  lift: require("../../assets/sounds/lift.wav"),
  place: require("../../assets/sounds/place.wav"),
  rowComplete: require("../../assets/sounds/row-complete.wav"),
  solved: require("../../assets/sounds/solved.wav"),
  wrong: require("../../assets/sounds/wrong.wav"),
};

type SoundName = keyof typeof soundFiles;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

function getPlayer(name: SoundName): AudioPlayer {
  if (!players[name]) {
    players[name] = createAudioPlayer(soundFiles[name]);
  }
  return players[name]!;
}

let muted = false;
let webAudioUnlocked = false;

export function isMuted(): boolean {
  return muted;
}

/**
 * Browsers block audio until a user gesture. Call this synchronously from
 * pointerdown/keydown so later play() calls are allowed.
 */
export function unlockWebAudio(): void {
  if (webAudioUnlocked) return;
  try {
    (Object.keys(soundFiles) as SoundName[]).forEach((name) => {
      const player = getPlayer(name);
      player.muted = true;
      player.play();
      player.pause();
      player.seekTo(0);
      player.muted = false;
    });
    webAudioUnlocked = true;
  } catch {
    // Try again on the next gesture if a player is not ready yet.
  }
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function playSound(name: SoundName) {
  if (muted) return;
  try {
    const player = getPlayer(name);
    player.seekTo(0);
    player.play();
  } catch {
    // Silently fail — sounds are non-critical
  }
}
