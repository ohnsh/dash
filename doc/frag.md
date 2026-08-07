Test whether fragmented mp4 (moof only appears in fmp4s):
```
ffprobe -v trace input.mp4 2>&1 | grep -e "type:'moof'" -e "type:'moov'"

ffprobe -v trace $mp4 2>&1 | grep -q "type:'moof'"
```

Show creation time in format (container)-level metadata:
```
ffprobe -v quiet -show_format -show_entries format_tags=creation_time
```

Show creation time in stream-level metadata:
```
ffprobe -v quiet -show_format -show_entries stream_tags=creation_time
```

Common options:
`-select_streams v:0`, `-of json`, `-of default=noprint_wrappers`

