# @dash/next

A Next.js frontend for the @dash/vod automated video pipeline and @dash/dashd backend service. So far, it's mostly just camera feeds, but over time, I'd like to shape it into a smart-home dashboard of sorts (hence the name).

## Notes to self

- CloudFlare [apparently](https://github.com/badges/shields/issues/11681) provides R2 bucket download stats via the [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/getting-started/). I didn't think such stats were available without placing a worker in front of the bucket and recording them manually (which could get complicated when serving range requests for large MP4's and attempting to cache them).
