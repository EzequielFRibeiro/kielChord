'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, Loader2, Music2, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import Header from '@/components/Header'
import AudioInput from '@/components/AudioInput'
import WaveformVisualizer from '@/components/WaveformVisualizer'
import ChordTimeline from '@/components/ChordTimeline'
import AnalysisResults from '@/components/AnalysisResults'
import ChordDictionary from '@/components/ChordDictionary'
import StemsSeparator from '@/components/StemsSeparator'
import LyricsView from '@/components/LyricsView'
import MidiExport from '@/components/MidiExport'
import { analyzeAudio, type AnalysisResult } from '@/lib/audioAnalysis'

type Tab = 'chords' | 'dictionary' | 'stems' | 'lyrics' | 'midi'

export default function HomePage() {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('chords')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedChord, setSelectedChord] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef(0)
  const offsetRef = useRef(0)
  const rafRef = useRef<number>(0)

  const stopPlayback = useCallback(() => {
    sourceNodeRef.current?.stop()
    sourceNodeRef.current = null
    setIsPlaying(false)
    cancelAnimationFrame(rafRef.current)
  }, [])

  const startPlayback = useCallback((from?: number) => {
    if (!audioBuffer) return
    stopPlayback()

    if (typeof window === 'undefined' || !window.AudioContext) return

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)

    const offset = from !== undefined ? from : offsetRef.current
    offsetRef.current = offset
    startTimeRef.current = ctx.currentTime - offset

    source.start(0, offset)
    sourceNodeRef.current = source
    setIsPlaying(true)

    source.onended = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      offsetRef.current = 0
      cancelAnimationFrame(rafRef.current)
    }

    const tick = () => {
      const t = ctx.currentTime - startTimeRef.current
      setCurrentTime(Math.min(t, audioBuffer.duration))
      offsetRef.current = t
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [audioBuffer, stopPlayback])

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  const handleSeek = useCallback((time: number) => {
    offsetRef.current = time
    setCurrentTime(time)
    if (isPlaying) startPlayback(time)
  }, [isPlaying, startPlayback])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      audioCtxRef.current?.close()
    }
  }, [])

  const handleAudioLoaded = useCallback(async (buffer: AudioBuffer, name: string) => {
    stopPlayback()
    setCurrentTime(0)
    offsetRef.current = 0
    setAudioBuffer(buffer)
    setFileName(name)
    setAnalysis(null)
    setIsAnalyzing(true)

    try {
      const result = await analyzeAudio(buffer)
      setAnalysis(result)
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [stopPlayback])

  const handleChordClick = (chord: string) => {
    setSelectedChord(chord)
    setActiveTab('dictionary')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chords', label: 'Chords' },
    { id: 'dictionary', label: 'Dictionary' },
    { id: 'stems', label: 'Stems' },
    { id: 'lyrics', label: 'Lyrics' },
    { id: 'midi', label: 'MIDI' },
  ]

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="noise" aria-hidden />

      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-teal-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-rose-500/3 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero */}
        {!audioBuffer && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-6"
          >
            <div className="inline-flex items-center gap-2 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-full">
              <Sparkles size={11} />
              AI-Powered Chord Detection
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
              Detect chords from<br />
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">any song instantly</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-lg mx-auto">
              Upload audio, use your microphone, or paste a YouTube URL. Get chords, key, BPM, stems, and lyrics in seconds.
            </p>
          </motion.div>
        )}

        {/* Input panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <AudioInput onAudioLoaded={handleAudioLoaded} isAnalyzing={isAnalyzing} />
        </motion.div>

        {/* Analysis loading */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-8 flex flex-col items-center gap-4"
            >
              <div className="flex items-end gap-1 h-12">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-amber-500 rounded-full"
                    animate={{ height: [4, Math.random() * 44 + 4, 4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06 }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">Analyzing audio — detecting chords, key & tempo...</span>
              </div>
              <p className="text-xs text-slate-500">Using chromagram analysis and pattern matching</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {analysis && audioBuffer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* File info + playback */}
              <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      isPlaying ? 'bg-amber-500/20' : 'bg-obsidian-700'
                    )}>
                      <Music2 size={16} className={isPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
                    </div>
                    <p className="text-sm font-medium text-slate-300 truncate">{fileName}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSeek(0)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <SkipBack size={15} />
                    </button>
                    <button
                      onClick={togglePlayback}
                      className="w-10 h-10 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-obsidian-950 rounded-full transition-colors shadow-lg shadow-amber-500/20"
                    >
                      {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  </div>
                </div>

                <WaveformVisualizer
                  audioBuffer={audioBuffer}
                  currentTime={currentTime}
                  duration={analysis.duration}
                  beats={analysis.beats}
                  onSeek={handleSeek}
                />

                {/* Time display */}
                <div className="flex justify-between text-xs text-slate-600 font-mono px-0.5">
                  <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(analysis.duration / 60)}:{Math.floor(analysis.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Stats */}
              <AnalysisResults
                bpm={analysis.bpm}
                musicalKey={analysis.key}
                keyConfidence={analysis.keyConfidence}
                duration={analysis.duration}
                totalChords={analysis.chords.length}
                uniqueChords={new Set(analysis.chords.map(c => c.chord).filter(c => c !== 'N/A')).size}
              />

              {/* Tabs */}
              <div className="glass rounded-2xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-white/5">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        'flex-1 text-sm font-medium py-3.5 px-2 transition-all relative',
                        activeTab === tab.id
                          ? 'text-amber-400 tab-active'
                          : 'text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-5">
                  <AnimatePresence mode="wait">
                    {activeTab === 'chords' && (
                      <motion.div key="chords" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ChordTimeline
                          chords={analysis.chords}
                          currentTime={currentTime}
                          duration={analysis.duration}
                          onChordClick={handleChordClick}
                          onSeek={handleSeek}
                        />
                      </motion.div>
                    )}
                    {activeTab === 'dictionary' && (
                      <motion.div key="dictionary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ChordDictionary highlightChord={selectedChord} />
                      </motion.div>
                    )}
                    {activeTab === 'stems' && (
                      <motion.div key="stems" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <StemsSeparator audioBuffer={audioBuffer} />
                      </motion.div>
                    )}
                    {activeTab === 'lyrics' && (
                      <motion.div key="lyrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <LyricsView audioBuffer={audioBuffer} chords={analysis.chords} />
                      </motion.div>
                    )}
                    {activeTab === 'midi' && (
                      <motion.div key="midi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <MidiExport chords={analysis.chords} bpm={analysis.bpm} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature highlights (shown before analysis) */}
        {!audioBuffer && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            id="features"
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {[
              { title: 'Chord Detection', desc: 'Deep learning chromagram analysis detects major, minor, 7th, maj7 & suspended chords', color: 'amber' },
              { title: 'Beat Tracking', desc: 'Precise BPM detection and downbeat tracking with onset strength analysis', color: 'teal' },
              { title: 'Key Recognition', desc: 'Krumhansl-Schmuckler algorithm identifies the musical key of any song', color: 'rose' },
              { title: 'Chord Dictionary', desc: 'Guitar, piano & ukulele diagrams for hundreds of chords', color: 'indigo' },
              { title: 'Stem Separation', desc: 'Separate vocals, bass, drums and other instruments into individual tracks', color: 'purple' },
              { title: 'MIDI Export', desc: 'Convert detected chord progressions to MIDI for use in your DAW', color: 'emerald' },
            ].map((f, i) => {
              const colors: Record<string, string> = {
                amber: 'border-amber-500/15 bg-amber-500/5 text-amber-400',
                teal: 'border-teal-500/15 bg-teal-500/5 text-teal-400',
                rose: 'border-rose-500/15 bg-rose-500/5 text-rose-400',
                indigo: 'border-indigo-500/15 bg-indigo-500/5 text-indigo-400',
                purple: 'border-purple-500/15 bg-purple-500/5 text-purple-400',
                emerald: 'border-emerald-500/15 bg-emerald-500/5 text-emerald-400',
              }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={clsx('rounded-xl border p-4 space-y-2', colors[f.color])}
                >
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-600">
          ChordLens — AI Chord Detection · Built with Next.js & Web Audio API
        </div>
      </footer>
    </div>
  )
}
