#!/usr/bin/env bash

exiftool \
  -api QuickTimeUTC \
  -j -g2 \
  -Other:FileSize \
  -Other:FileType \
  -Other:MIMEType \
  -Time:CreateDate \
  -Time:ModifyDate \
  -Video:MajorBrand \
  -Video:TimeScale \
  -Video:Duration \
  -Video:ImageWidth \
  -Video:ImageHeight \
  -Video:ColorPrimaries \
  -Video:TransferCharacteristics \
  -Video:AverageBitrate \
  -Video:VideoFrameRate \
  -Video:Rotation \
  -Image:CompressorID \
  -Image:BitDepth \
  -Image:ImageSize \
  -Audio:AudioFormat \
  -Audio:AudioChannels \
  -Audio:AudioBitsPerSample \
  -Audio:AudioSampleRate \
  "$@"

