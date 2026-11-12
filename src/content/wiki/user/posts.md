---
title: "Finding Posts"
description: "Combine article search, topics and geographic discovery."
section: user
order: 12
---

## Browse and search

[Posts](/posts/) is the only article search/filter browser. Default order is publication newest first. Type into the search field to search published article text with Pagefind. Metadata filters combine with those results; there is no separate search service.

## Filter dimensions

- **Tags**: flexible topics chosen by the author.
- **Places** (under Places, Trips and sorting): explicit Place references plus Places belonging to an explicitly related Trip.
- **Trips** (advanced): only journeys explicitly referenced by the article. Mentioning a Place does not associate an article with all Trips that visit it.

Choose multiple values in a dimension to match any (OR). Different dimensions and search combine with AND. Counts beside options describe the whole published collection; they do not recalculate after each filter. Places and Trips with no associated published Posts are not offered as article filter options, even though they can appear in Atlas.

Active summaries and each group's Clear action remove that dimension alone. **Clear Filters** resets all dimensions and sorting. Unknown filter IDs remain removable and show no matches.

## Dates and ordering

Publication remains the default. Experience newest/oldest sorts by the latest known Experience range start month, independently of display order. Undated articles come last in both directions, in an **Undated experience** group. Their displayed date is labeled Published; dates are never invented.

## Share and return

The URL carries search, tags, Places, Trips and nondefault sorting. Copy it to share the view. Checkbox, sort and clear actions create history entries; typing replaces the current entry. Back/Forward restores controls and results. A single-dimension clear keeps the rest of your query.

## Article geography

Articles show Published, Updated and Experience months together at the top, hiding absent values. Experience ranges retain the author's display order. **Explore in Atlas** lists Trips and Places on separate wrapping lines. Both display lists show unique links in first-authored order; repeated source references are preserved. These orders can differ from a Trip's chronological visiting sequence.

Atlas links preselect details without Focus. A Place discovery match derived from a Trip does not silently add it to the article's authored Place list or prove the author visited it. No large article map, GPX or terrain preview is implemented.

## Empty states

With no published Posts the browser reports zero results. Drafts are excluded in production. Search requires a production build and JavaScript; if unavailable, clear the query and browse the static list. Without JavaScript all published article links remain available, but filtering is disabled.
