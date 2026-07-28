import { $ } from 'bun'

const opts = ['-api', 'QuickTimeUTC', '-j']
const tags = [
  '-FileSize',
  '-FileType',
  '-MIMEType',
  '-CreateDate',
  '-ModifyDate',
  '-MajorBrand',
  '-TimeScale',
  '-Duration',
  '-ImageWidth',
  '-ImageHeight',
  '-ColorPrimaries',
  '-TransferCharacteristics',
  '-AverageBitrate',
  '-VideoFrameRate',
  '-Rotation',
  '-CompressorID',
  '-BitDepth',
  '-ImageSize',
  '-AudioFormat',
  '-AudioChannels',
  '-AudioBitsPerSample',
  '-AudioSampleRate',
]

export default (video: string) =>
  $`exiftool ${opts} ${tags} ${video}`.json().then(wrangle)

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
