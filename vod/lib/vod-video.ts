import { basename, dirname, join } from 'node:path'
import type { VoiceResult } from 'voice-detect'
import exiftool, { type ExiftoolProbe } from './exiftool'
import ffprobe, { type FFprobeStream } from './ffprobe'
import { mkthumb } from './mkassets'
import type { VODVideo } from './schema'

export interface VODVideoContext {
  path: string
  name: string
  type: 'hls' | 'mp4' | 'mov'
  assets?: string[]
  exiftoolData?: ExiftoolProbe
  ffprobeData?: FFprobeStream
  voiceSegments?: VoiceResult
}

export const isVideoFile = (name: string) => /\.(mov|mp4)$/i.test(name)
export const getVideoType = (name: string): VODVideo['type'] => {
  const type = name.match(/\.([^.]+)$/)?.[1]
  switch (type) {
    case 'hls':
    case 'mp4':
    case 'mov':
      return type
  }
  throw new Error(`Invalid video type ${type}`)
}

export async function newContext(path: string): Promise<VODVideoContext> {
  if (!isVideoFile(path)) {
    throw new Error(`Invalid video file: ${path}`)
  }

  if (!(await Bun.file(path).exists())) {
    throw new Error(`Video file doesn't exist: ${path}`)
  }

  return { path, name: basename(path), type: getVideoType(path) }
}

export async function attachMetadata(ctx: VODVideoContext) {
  if (ctx.exiftoolData && ctx.ffprobeData) {
    return ctx
  }

  let { exiftoolData, ffprobeData } = ctx

  if (!exiftoolData) {
    exiftoolData = await exiftool(ctx.path)
  }
  if (!ffprobeData) {
    ffprobeData = await ffprobe(ctx.path)
  }

  return { ...ctx, exiftoolData, ffprobeData }
}

const getAssetDir = (path: string) =>
  join(dirname(path), '_assets', basename(path))

export async function attachAssets(ctx: VODVideoContext) {
  if (ctx.assets) {
    return ctx
  }
  ctx = await attachMetadata(ctx)
  if (!ctx.ffprobeData) {
    throw new Error('ffprobeData unexpectedly absent from context.')
  }
  const outDir = getAssetDir(ctx.path)
  const thumbPath = await mkthumb(ctx.path, {
    outDir,
    metadata: ctx.ffprobeData,
  })
  return { ...ctx, assets: [thumbPath] }
}

// const assets = await fs
//   .readdir(assetDir)
//   .then((list) => list.map((name) => join(assetDir, name)))
//   .catch((_e) => [] as string[])

export async function attachVoiceSegments(ctx: VODVideoContext) {
  if (ctx.voiceSegments) {
    return ctx
  }
  ctx = await attachMetadata(ctx)
  if (!ctx.ffprobeData) {
    throw new Error('ffprobeData unexpectedly absent from context.')
  }
  const { hasAudio } = ctx.ffprobeData
  if (!hasAudio) {
    return ctx
  }

  // could import earlier to avoid doing any work if onnxruntime won't load
  try {
    const { default: voiceDetect } = await import('voice-detect')
    const voiceSegments = await voiceDetect(ctx.path)
    return { ...ctx, voiceSegments }
  } catch {
    return ctx
  }
}

type CompleteVODVideoContext = Pick<VODVideoContext, 'voiceSegments'> &
  Required<Omit<VODVideoContext, 'voiceSegments'>>

export async function videoPipeline(
  ctx: VODVideoContext,
): Promise<CompleteVODVideoContext> {
  ctx = await attachMetadata(ctx)

  const [assetCtx, voiceCtx] = await Promise.all([
    attachAssets(ctx),
    attachVoiceSegments(ctx),
  ])

  const { voiceSegments } = voiceCtx
  const { ffprobeData, exiftoolData, assets } = assetCtx
  if (!ffprobeData || !exiftoolData || !assets) {
    throw new Error('assetCtx unexpectedly missing properties')
  }

  return {
    ...ctx,
    assets,
    ffprobeData,
    exiftoolData,
    ...(voiceSegments && { voiceSegments }),
  }
}

export async function toMetadata(ctx: VODVideoContext): Promise<VODVideo> {
  const { name, type, assets, ffprobeData, exiftoolData, voiceSegments } =
    await videoPipeline(ctx)

  return {
    name,
    type,
    assets,
    meta_ffprobe: ffprobeData,
    meta_exiftool: exiftoolData,
    voiceSegments,
  }
}
