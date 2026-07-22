import Image from 'next/image'

export default function Home() {
  return (
    <main>
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

      <video controls playsInline>
        <source src="https://hls.ohn.sh/wuuk/index.m3u8" />
      </video>

      <iframe
        title="MediaMTX iframe"
        src="http://hls.ohn.sh/wyze1"
        width="640"
        height="360"
        allow="autoplay"
        className="border-0"
      ></iframe>
    </main>
  )
}
