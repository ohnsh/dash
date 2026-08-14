import { $ } from 'bun'
import { SileroVAD, type VADParams, type VoiceSegment } from './silero-vad'

export type { VoiceSegment }

export interface VoiceResult {
  duration: number
  speechRatio: number
  speechTotal: number
  params: VADParams
  segments: VoiceSegment[]
}

const SAMPLE_RATE = 16000

function log(msg: string, { file = Bun.stderr } = {}) {
  const stamp = new Date()
    .toLocaleString('en-CA', {
      dateStyle: 'short',
      timeStyle: 'medium',
      hour12: false,
    })
    .replace(/^\d{4}-/, '')
    .replace(',', '')

  file.write(`[voice-detect.ts ${stamp}] ${msg}\n`)
}

// use ffmpeg to extract first audio stream and re-encode to
// 16kHz / float32 / single-channel PCM
async function extractPcmFromVideo(videoPath: string): Promise<Float32Array> {
  const pcmBuffer = $`ffmpeg \
    -v warning \
    -i ${videoPath} \
    -f f32le \
    -c:a pcm_f32le \
    -ac 1 \
    -ar ${SAMPLE_RATE} \
    -map 0:a \
    -
  `.arrayBuffer()

  return new Float32Array(await pcmBuffer)
}

// use ffprobe to probe for duration of first audio stream in file
// EDIT: nevermind, use the audioBuffer.length/sampleRate calculation instead.
async function probeDuration(mediaPath: string) {
  const probe = await $`
    ffprobe -select_streams a:0 \
    -show_entries stream=duration \
    -of json \
    ${mediaPath}
  `.json()

  const rawDuration = probe?.streams[0]?.duration

  if (!rawDuration) {
    throw new Error(`ffprobe did not return a duration for ${mediaPath}`)
  }

  return Number(parseFloat(rawDuration).toFixed(1))
}

// use ffprobe to detect whether a file contains an audio track
// TODO: de-duplicate this function, which is already in mkoverlay/lib/ffprobe.ts
// Since mkoverlay depends on this package, ffprobe/exiftool helpers will need to be
// factored out.
export async function testAudio(mediaPath: string): Promise<boolean> {
  try {
    const probe = await $`
    ffprobe -v quiet \
      -select_streams a \
      -show_entries stream=codec_type \
      -of default=noprint_wrappers=1 \
      ${mediaPath}
    `.text()

    // output is `codec_type=audio` when audio is present, blank otherwise.
    return probe.includes('audio')
  } catch {
    return false
  }
}

const modelPath = `${import.meta.dir}/../onnx/silero_vad.onnx`

export default async function voiceDetect(
  mediaPath: string,
  { shouldTestForAudio = false } = {},
): Promise<VoiceResult> {
  if (shouldTestForAudio) {
    const hasAudio = await testAudio(mediaPath)
    if (!hasAudio) {
      throw new Error(`No audio stream in ${mediaPath}`)
    }
  }

  // keep stdout clean by logging to stderr (but without console.error formatting)
  log('Loading Silero VAD ONNX model...')
  const vad = await SileroVAD.create(modelPath)

  log('Demuxing video stream...')
  const audioBuffer = await extractPcmFromVideo(mediaPath)
  const duration = Number((audioBuffer.length / SAMPLE_RATE).toFixed(1))

  log(`Analyzing ${duration}s of audio...`)
  const segments = await vad.processAudioBuffer(audioBuffer)
  const speechTotal = segments.reduce<number>(
    (sum, { start, end }) => sum + end - start,
    0,
  )
  const speechRatio = Number((speechTotal / duration).toFixed(3))
  log(`Found ${speechTotal}s of speech in ${segments.length} segments.`)

  const params = SileroVAD.getDefaultParams()

  return {
    duration,
    speechRatio,
    speechTotal,
    params,
    segments,
  }
}

async function run() {
  const mediaPath = Bun.argv[2]
  if (!mediaPath) {
    throw new Error(`Usage: ${Bun.argv[1]} FILE`)
  }

  const result = await voiceDetect(mediaPath)

  Bun.stdout.write(JSON.stringify(result, undefined, 2) + '\n')
}

if (import.meta.main) {
  run().catch(console.error)
}
