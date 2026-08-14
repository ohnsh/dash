import { $ } from 'bun'
import { exiftoolSchema } from './schema'

const OPTS = ['-api', 'QuickTimeUTC', '-j']
const TAGS = [
  '-FileSize',
  '-MIMEType',
  '-CreateDate',
  '-TimeScale',
  '-Duration',
  '-ImageWidth',
  '-ImageHeight',
  '-AverageBitrate',
  '-VideoFrameRate',
  '-Rotation',
  '-CompressorID',
  '-BitDepth',
  '-AudioFormat',
  '-AudioChannels',
  '-AudioBitsPerSample',
  '-AudioSampleRate',
]

export default (video: string) =>
  $`exiftool ${OPTS} ${TAGS} ${video}`
    .json()
    .then(wrangle)
    .then(exiftoolSchema.parse)

// Transform exiftool output. Currently just camelCases property names.
function wrangle([exiftool_output]: [Record<string, string | number>]) {
  const lowerKey = (key: string) =>
    key === 'MIMEType'
      ? 'mimeType'
      : key.slice(0, 1).toLocaleLowerCase() + key.slice(1)

  return Object.fromEntries(
    Object.entries(exiftool_output).map(([key, val]) => [lowerKey(key), val]),
  )
}
