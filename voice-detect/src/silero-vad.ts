import * as ort from 'onnxruntime-node'

// Params appear to work with Silero v5 and v6
const SAMPLE_RATE = 16000
const WINDOW_SIZE_SAMPLES = 512 // 32ms window at 16kHz
const STATE_SIZE = 2 * 1 * 128 // Silero RNN state shape [2, 1, 128]

const SPEECH_THRESHOLD = 0.5
const HYSTERESIS = 0.15

// post-processing params
const MIN_GAP_SEC = 10
const PADDING_SEC = 2

export interface VoiceSegment {
  start: number // in seconds
  end: number // in seconds
  confidence: number
}
export type VADParams = ReturnType<(typeof SileroVAD)['getDefaultParams']>

export class SileroVAD {
  private session!: ort.InferenceSession
  private stateTensor!: ort.Tensor
  private contextBuffer = new Float32Array(64)

  // intialization is asynchronous, so use a static factory method
  // instead of a public constructor
  static async create(modelPath: string): Promise<SileroVAD> {
    const vad = new SileroVAD()

    // configure Execution Providers based on host OS
    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: [
        process.platform === 'darwin'
          ? { name: 'cpu' } // or coreml (performance was identical in first test)
          : { name: 'cpu' },
      ],
      graphOptimizationLevel: 'all',
    }

    vad.session = await ort.InferenceSession.create(modelPath, options)
    vad.resetState()

    return vad
  }

  static getDefaultParams() {
    return {
      minConfidence: SPEECH_THRESHOLD,
      hysteresis: HYSTERESIS,
      padding: PADDING_SEC,
      minGap: MIN_GAP_SEC,
    }
  }

  // Call before processing a new audio stream.
  public resetState(): void {
    const emptyState = new Float32Array(STATE_SIZE).fill(0)
    this.stateTensor = new ort.Tensor('float32', emptyState, [2, 1, 128])
    this.contextBuffer.fill(0)
  }

  // Process a single 512-sample frame of 16kHz Float32 PCM audio.
  public async processChunk(chunk: Float32Array): Promise<number> {
    if (chunk.length !== WINDOW_SIZE_SAMPLES) {
      throw new Error(
        `Chunk size must be exactly ${WINDOW_SIZE_SAMPLES} samples.`,
      )
    }

    const input576 = new Float32Array(WINDOW_SIZE_SAMPLES + 64)
    input576.set(this.contextBuffer, 0)
    input576.set(chunk, 64)

    this.contextBuffer.set(chunk.subarray(chunk.length - 64))

    // Input audio chunk tensor: shape [1, 512]
    const inputTensor = new ort.Tensor('float32', input576, [
      1,
      WINDOW_SIZE_SAMPLES + 64,
    ])
    const srTensor = new ort.Tensor('int64', BigInt64Array.from([16000n]), [1])

    // Feed forward pass
    const feeds: Record<string, ort.Tensor> = {
      input: inputTensor,
      sr: srTensor,
      state: this.stateTensor,
    }

    const results = await this.session.run(feeds)

    if (!results.stateN || !results.output?.data) {
      throw results
    }

    // Update recurrent state for the next chunk iteration
    this.stateTensor = results.stateN

    // Extract speech probability (scalar output)
    const probData = results.output.data as Float32Array

    if (typeof probData[0] !== 'number') {
      throw new Error('probData[0] is not a number')
    }
    return probData[0]
  }

  // Process whole Float32 audio buffer and return speech timestamps.
  public async processAudioBuffer(
    pcmAudio: Float32Array,
    {
      duration,
      minConfidence = SPEECH_THRESHOLD,
    }: { duration?: number; minConfidence?: number } = {},
  ): Promise<VoiceSegment[]> {
    this.resetState()
    const segments: VoiceSegment[] = []

    let isSpeaking = false
    let speechStart = 0
    let currentConfidenceSum = 0
    let frameCount = 0

    const totalChunks = Math.floor(pcmAudio.length / WINDOW_SIZE_SAMPLES)

    for (let i = 0; i < totalChunks; i++) {
      // current slice of audio buffer
      const offset = i * WINDOW_SIZE_SAMPLES
      const chunk = pcmAudio.subarray(offset, offset + WINDOW_SIZE_SAMPLES)
      const currentTime = offset / SAMPLE_RATE

      // run the model
      const prob = await this.processChunk(chunk)

      // this is a state machine with memory (hysteresis).
      // a probability > minConfidence begins a speech segment.
      // but only a probability < (minConfidence - HYSTERESIS) will end it.
      if (prob >= minConfidence) {
        if (!isSpeaking) {
          isSpeaking = true
          speechStart = currentTime
          currentConfidenceSum = 0
          frameCount = 0
        }
        currentConfidenceSum += prob
        frameCount++
      } else if (isSpeaking && prob < minConfidence - HYSTERESIS) {
        isSpeaking = false
        const speechEnd = currentTime

        // Filter out tiny noise bursts (< 0.2s)
        if (speechEnd - speechStart >= 0.2) {
          segments.push({
            start: Number(speechStart.toFixed(2)),
            end: Number(speechEnd.toFixed(2)),
            confidence: Number((currentConfidenceSum / frameCount).toFixed(2)),
          })
        }
      }
    }

    // post-processing helper to round, pad, and combine segments
    return segments.reduce<VoiceSegment[]>((acc, current) => {
      const working = acc.pop()

      // don't pad past zero or duration
      const start = Math.max(0, Math.round(current.start - PADDING_SEC))
      const end = Math.min(
        duration ?? Infinity,
        Math.round(current.end + PADDING_SEC),
      )
      const confidence = current.confidence

      // first segment
      if (!working) {
        return [{ start, end, confidence }]
      }

      // segments aren't too close; leave them separate
      if (start - working.end >= MIN_GAP_SEC) {
        acc.push(working, { start, end, confidence })
        return acc
      }

      // combine these two segments
      // to compute average confidence, weigh the two inputs by the
      // number of samples they represent
      const weight = (end - start) / (end - working.start)
      const avgConfidence =
        weight * confidence + (1 - weight) * working.confidence

      acc.push({
        start: working.start,
        end,
        confidence: Number(avgConfidence.toFixed(3)),
      })

      return acc
    }, [])
  }
}
