import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, FastForward, Music } from 'lucide-react';

export const AudioPlayer = ({ src, fileName, compact = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Full URL helper
  const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
  const fullAudioUrl = src?.startsWith('http') ? src : `${backendBase}${src}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [fullAudioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!src) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 italic">
        <Music className="h-3.5 w-3.5" />
        <span>No audio attached</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 shadow-xs transition-colors ${compact ? 'max-w-xs' : 'w-full'}`}>
      <audio ref={audioRef} src={fullAudioUrl} preload="metadata" />

      {fileName && (
        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mb-0.5">
          <span className="truncate flex items-center gap-1">
            <Music className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {fileName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all active:scale-95"
          title={isPlaying ? 'Pause' : 'Play recording'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />}
        </button>

        {/* Scrubber Range */}
        <div className="flex-1 flex flex-col justify-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700 accent-indigo-600"
          />
        </div>

        {/* Speed button */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Playback speed"
        >
          {playbackRate}x
        </button>

        {/* Mute button */}
        <button
          type="button"
          onClick={toggleMute}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>

        {/* Download file button */}
        <a
          href={fullAudioUrl}
          download={fileName || 'call_recording.mp3'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          title="Download audio recording"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
