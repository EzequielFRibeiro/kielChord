'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Mic, Youtube, Link, X, FileAudio, Loader2, Play } from 'lucide-react'
import clsx from 'clsx'

interface AudioInputProps {
  onAudioLoaded: (buffer: AudioBuffer, fileName: string, url?: string) => void
  isAnalyzing: boolean
}

type InputMode = 'upload' | 'mic' | 'youtube' | 'url'

export default function AudioInput({ onAudioLoaded, isAnalyzing }: AudioInputProps) {
  const [mode, setMode] = useState<InputMode>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [micActive, setMicActive] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const processFile = useCallback(async (file: File) => {
    setLoadError(null)
    setFileName(file.name)
    setIsLoading(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      if (typeof window === 'undefined' || !window.AudioContext) {
        throw new Error('AudioContext not available')
      }
      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      onAudioLoaded(audioBuffer, file.name)
    } catch {
      setLoadError('Failed to decode audio. Please use MP3, WAV, OGG, or M4A format.')
    } finally {
      setIsLoading(false)
    }
  }, [onAudioLoaded])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return
    setLoadError(null)
    setIsLoading(true)

    // Check if YouTube URL
    const ytMatch = urlInput.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/)

    if (ytMatch || mode === 'youtube') {
      try {
        // Fetch via proxy API route
        const res = await fetch(`/api/youtube?url=${encodeURIComponent(urlInput)}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to load YouTube audio')
        }
        const arrayBuffer = await res.arrayBuffer()
        const audioCtx = new AudioContext()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        onAudioLoaded(audioBuffer, urlInput, urlInput)
      } catch (err: unknown) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load audio from URL')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Direct audio URL
    try {
      const res = await fetch(urlInput)
      if (!res.ok) throw new Error('Failed to fetch audio')
      const arrayBuffer = await res.arrayBuffer()
      if (typeof window === 'undefined' || !window.AudioContext) {
        throw new Error('AudioContext not available')
      }
      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      onAudioLoaded(audioBuffer, urlInput, urlInput)
    } catch {
      setLoadError('Failed to load audio from URL. CORS may be blocking the request.')
    } finally {
      setIsLoading(false)
    }
  }

  const startMicRecording = async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        throw new Error('MediaDevices not available')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setMicActive(true)

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const arrayBuffer = await blob.arrayBuffer()
        if (typeof window === 'undefined' || !window.AudioContext) {
          setLoadError('AudioContext not available')
          return
        }
        const audioCtx = new AudioContext()
        try {
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          onAudioLoaded(audioBuffer, 'Microphone Recording')
        } catch {
          setLoadError('Failed to decode microphone audio')
        }
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
    } catch {
      setLoadError('Microphone access denied. Please allow microphone permissions.')
    }
  }

  const stopMicRecording = () => {
    mediaRecorderRef.current?.stop()
    setMicActive(false)
  }

  const modes: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload File', icon: <Upload size={15} /> },
    { id: 'youtube', label: 'YouTube', icon: <Youtube size={15} /> },
    { id: 'url', label: 'Audio URL', icon: <Link size={15} /> },
    { id: 'mic', label: 'Microphone', icon: <Mic size={15} /> },
  ]

  return (
    <div className="w-full">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-obsidian-800/60 rounded-xl mb-4 border border-white/5">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setLoadError(null) }}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-2 rounded-lg font-medium transition-all duration-200',
              mode === m.id
                ? 'bg-amber-500 text-obsidian-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Upload */}
        {mode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
                isDragging
                  ? 'border-amber-500/70 bg-amber-500/5'
                  : 'border-white/10 bg-obsidian-800/30 hover:border-amber-500/40 hover:bg-amber-500/5'
              )}
            >
              {isLoading ? (
                <Loader2 size={32} className="text-amber-400 animate-spin" />
              ) : fileName ? (
                <>
                  <FileAudio size={32} className="text-amber-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-200 truncate max-w-xs">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Upload size={22} className="text-amber-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Drop audio here or <span className="text-amber-400">browse</span></p>
                    <p className="text-xs text-slate-500 mt-1">MP3, WAV, OGG, M4A, FLAC</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </motion.div>
        )}

        {/* YouTube / URL */}
        {(mode === 'youtube' || mode === 'url') && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlLoad()}
                  placeholder={mode === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/song.mp3'}
                  className="w-full bg-obsidian-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                />
                {urlInput && (
                  <button
                    onClick={() => setUrlInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={handleUrlLoad}
                disabled={isLoading || !urlInput.trim()}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-obsidian-950 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} fill="currentColor" />}
                Load
              </button>
            </div>
            {mode === 'youtube' && (
              <p className="text-xs text-slate-500 px-1">
                Paste a YouTube URL to analyze the song's chords and key.
                <span className="text-amber-500/70"> Note: YouTube requires server-side processing.</span>
              </p>
            )}
          </motion.div>
        )}

        {/* Microphone */}
        {mode === 'mic' && (
          <motion.div
            key="mic"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <motion.button
              onClick={micActive ? stopMicRecording : startMicRecording}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
                micActive
                  ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                  : 'bg-obsidian-800 border-2 border-white/10 hover:border-amber-500/40'
              )}
            >
              <Mic size={28} className={micActive ? 'text-white animate-pulse' : 'text-slate-400'} />
            </motion.button>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                {micActive ? 'Recording... click to stop' : 'Click to start recording'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {micActive ? 'Play or sing your melody' : 'Record up to 60 seconds for best results'}
              </p>
            </div>
            {micActive && (
              <div className="flex items-end gap-1 h-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-rose-500 rounded-full"
                    animate={{ height: [4, Math.random() * 28 + 4, 4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loadError && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5"
        >
          <X size={14} className="mt-0.5 flex-shrink-0" />
          {loadError}
        </motion.div>
      )}
    </div>
  )
}
