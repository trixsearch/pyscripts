module.exports = {
  "globDirectory": "buildmaster/org/",
  "globPatterns": [
    "**/*.{eot,otf,ttf,woff,woff2,gif,ico,jpg,png,svg,txt,html,css,js}",
    "manifest.json"
  ],
  "swDest": "buildmaster/org/sw.js",
  "swSrc": "public/custom-service-worker.js",
  // Maximum file size to caching is 5mb
  "maximumFileSizeToCacheInBytes": 5 * 1024 * 1024
};