/**
 * Bicycle Field Notes — site identity and features.
 * Only `title` and `url` matter to get started; everything else has a default.
 */
export const SITE = {
  title: "Bicycle Field Notes",
  description: "Cycling routes, travel notes, and observations from the road.",
  url: "https://eliotziqi.github.io/bicycle-field-notes/", // your deployed URL (used for RSS, sitemap, canonical links)
  author: "Eliot",
  lang: "en",

  // Header navigation. Remove or add links freely.
  nav: [
    { label: "Posts", href: "/posts" },
    { label: "Tags", href: "/tags" },
    { label: "About", href: "/about" },
  ],

  // Turn features on or off.
  features: {
    search: true, // needs `npm run build` once; search runs on the built site
    readingMode: true, // font size, width and typeface controls on posts
    toc: true, // table of contents on posts
    ogImages: true, // generate a social preview image for every post at build time
  },

  postsOnHome: 6,
  // Links shown in the footer. Leave empty to hide.
  social: [
    { label: "RSS", href: "/rss.xml" },
  ],
};
