---
title: "Using Atlas"
description: "Explore geographic Places and ordered journeys without inferred routes."
section: user
order: 11
---

## Places and Trips

A Place is a unique geographic location. Its Ridden, Visited and Wishlist statuses can overlap. A Trip is a journey whose visiting sequence can include the same Place more than once. Places and Trips can exist independently of published articles.

[Open Atlas](/atlas/). A fresh load faces a random existing Place at global scale, without selecting it or opening details. With no Places it uses a stable global view. Rotate and zoom freely; the globe does not continuously spin.

## Select details

Choose a Place from the list or map to emphasize only it. Details show its description, status, optional cover, associated Trips and published Posts when available. Choose which related Trip to inspect; selecting a Place does not select all its Trips.

Choose a Trip to highlight its unique Places and read the complete chronological list, including return visits such as A → B → A. There are no connecting lines: membership is not a recorded route. Choosing an itinerary Place opens that Place and offers **Return to Trip**.

Clear selection to return to filtering; filters remain set. Explicit selections remain visible even when they do not match filters. A related Post labeled “via related Trip” is associated through a Trip, not necessarily an explicit mention or evidence of a visit.

## Search and display modes

Search matches Place names and names of Trips containing them. Select multiple statuses or Trips: choices within either group use OR; search, statuses and Trips combine with AND.

**Highlight** is the default: matching markers are prominent, others dimmed. **Show Only** hides nonmatches, while explicit selections remain visible. Region filtering is unavailable because current records have no reliable region field. Atlas filters are temporary and are not saved in the URL.

## Focus and clusters

**Focus** moves the camera only when you activate it. Priority is the selected Place, then selected Trip, then results of active filters. It is disabled without a selection or active nonempty filtered target. Selecting or filtering never continuously tracks or automatically moves the camera.

Nearby markers cluster at low zoom; counts describe members of that cluster. Activate a cluster to zoom into it. Selected Places are rendered outside clusters, so they remain available. Repeated visits create no duplicate map markers. If selected Places overlap, use the list to inspect them.

## Share a selection

Selecting an item updates `?place=ID` or `?trip=ID`; copy the URL to share it. Opening that link selects details without Focus. Back/Forward restores selection without camera movement. Unknown IDs show a message rather than crashing. Article links use the same behavior.

## Panels, themes and availability

On desktop, collapse the sidebar to enlarge the globe. On mobile, use **Compact**, **Half** or **Full**; the panel changes size with buttons rather than drag gestures over the map. Scroll the panel separately from globe rotation/pinch zoom.

Map theme offers Follow site, Light and Dark. A map-style loading error exposes Retry while the lists remain usable. Unsupported WebGL falls back to lists/details. Without JavaScript the static lists remain, but dynamic filters/details are unavailable. Attribution must stay visible.

A globe cannot show both hemispheres at once. World-spanning Focus may still require rotation. Atlas has no GPX tracks, terrain previews or inferred routes; see [the implementation and limitations](../developer/atlas.md).
