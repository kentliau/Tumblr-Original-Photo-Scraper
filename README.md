# Tumblr Original Photo Scraper

Simple script to download original photos and reblogged photos from a Tumblr blog, it skip already downloadeded file, no big harm of rerun the script, it just not efficient.

Usage
`> node index.js url [limit]`
- url: tumblr url, just the subdomain part like `shylittlebaby` from `shylittlebaby.tumblr.com`
- limit: maximum parallel requests to parse a page, default to `1`, go slow, tumblr has limit
