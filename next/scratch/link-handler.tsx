'use client'

// open external links in new tab
// (Gemini's idea to use a wrapper component rather than a global script)

import { useEffect } from 'react'

export default function ExternalLinkHandler() {
  useEffect(() => {
    const handleExternalLinks = () => {
      const links = document.querySelectorAll('a')

      links.forEach((link) => {
        const href = link.getAttribute('href')

        // Check if it is an external link
        if (
          href &&
          (href.startsWith('http://') || href.startsWith('https://'))
        ) {
          const url = new URL(href)

          if (url.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank')
            link.setAttribute('rel', 'noopener noreferrer')
          }
        }
      })
    }

    // Run on initial load
    handleExternalLinks()

    // Optional: Watch for dynamically added content
    const observer = new MutationObserver(handleExternalLinks)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
