export default async function ({ streamUrl }: { streamUrl: string }) {
  return (
    <>
      {/*
        https://github.com/openai/whisper
        https://github.com/ggml-org/whisper.cpp
        <video src="stream-url.mp4" controls>
        <track
          kind="captions"
          src="captions.vtt"
          srclang="en"
          label="English"
          default
        />
        </video>
      */}

      <video width="640" height="360" controls playsInline>
        <source type="application/vnd.apple.mpegurl" src={streamUrl} />
      </video>
    </>
  )
}
