// Static-host fallback for existing feed subscriptions. Vercel redirects this
// URL permanently to /blog/rss.xml; other hosts can still read this mirror.
export { GET } from './blog/rss.xml';
