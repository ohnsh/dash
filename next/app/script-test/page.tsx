import Script from 'next/script'
import ClientStream from './client'

// A silly experiment, out of curiosity. It works.

const streamUrl = 'https://hls.ohn.sh/wuuk/index.m3u8'

export default async function ScriptTest() {
  return (
    <main>
      <video
        id="video"
        // suppressHydrationWarning
        controls
        autoPlay
        muted
        width="640"
        height="360"
      ></video>

      <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>

      {/* id required for inline scripts */}
      {/* lowercase <script> will work with `dangerouslySetInnerHTML` */}
      <Script id="vid-attach-inline" strategy="afterInteractive">
        {`const video = document.getElementById('video')
        const streamUrl = '${streamUrl}'

        if (Hls.isSupported()) {
          // For Edge, Chrome, Firefox, etc.
          const hls = new Hls({
            // MediaMTX low-latency options can be tuned here if needed
            liveSyncDurationCount: 3,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari (native HLS support)
          video.src = streamUrl;
        }`}
      </Script>

      <ClientStream streamUrl={streamUrl} />
    </main>
  )
}
