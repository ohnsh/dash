import Script from 'next/script'

interface Params {
  streamUrl: string
}

export default async function ({ streamUrl }: Params) {
  return (
    <div>
      <video
        id="video"
        // suppressHydrationWarning
        controls
        autoPlay
        muted
        width="640"
        height="360"
      ></video>

      {/* id required for inline scripts */}
      {/* lowercase <script> will work with `dangerouslySetInnerHTML` */}
      <Script id="vid-attach-inline" strategy="lazyOnload">
        {`const video = document.getElementById('video')
        const streamUrl = '${streamUrl}'

        if (Hls.isSupported()) {
          // For Edge, Chrome, Firefox, etc.
          console.log('Using hls.js!')
          const hls = new Hls({
            // MediaMTX low-latency options can be tuned here if needed
            liveSyncDurationCount: 3,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Dropping hls.js! Using native Safari HLS support.')
          // For Safari (native HLS support)
          video.src = streamUrl;
        }`}
      </Script>
    </div>
  )
}
