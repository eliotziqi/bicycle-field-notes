---
title: "Validation and publishing recovery"
description: "What the CMS checks, how publication is gated, and how to recover without losing saved edits."
section: publishing
order: 25
---

## Save first, publish a validated snapshot

Continue editing **main** in hosted Pages CMS. Saves remain Git commits, including invalid entries. No staging branch, pull request, custom CMS or extra service is required. A save starts **Validate and publish** in GitHub Actions. A CMS save is not proof of publication.

The workflow validates the saved source, prepares automatic Post months in its isolated working tree, validates again and builds Astro plus Pagefind. Only after success may it commit automatic months and upload the built artifact. Deployment requires that main still matches the validated revision. Non-force pushes and revision checks protect newer saved edits. GitHub concurrency can supersede pending runs; the newest run includes all saved changes.

When any entry is invalid, the entire snapshot waits and the previous site remains online. Other valid edits remain saved in Git and are explicitly listed in the workflow summary as pending. They publish together when the error is corrected. This avoids silently omitting individual invalid records or publishing inconsistent references. It does mean one unfinished entry can delay other publication; independently publishing a subset would require deliberately separating those edits into branches or commits.

## Collection audit and validation boundaries

| Content | Native CMS assistance | Repository validation before publication |
| --- | --- | --- |
| Posts | Required title/description, meaningful-text patterns, month string patterns, ordered object lists | Empty/incomplete rows, month ordering, target existence, Markdown/MDX syntax and static local media |
| Gallery | Required image/title/description/categories, category/Post selectors | Missing uploads, unsupported Gallery formats, deleted categories/Posts, invalid types |
| Gallery Categories | Required meaningful title | Duplicate titles and references broken by title renames/deletions |
| Places | Stable-ID pattern, required fields, numeric bounds, status choices | ID/filename agreement, malformed values, duplicate IDs, missing cover files |
| Trips | Required fields and visits, reference picker, native date input | Empty visits, deleted Places, calendar dates, reversed date ranges, ID/filename agreement |
| Markdown/MDX and media | Visual editor and upload picker | Frontmatter parsing/duplicate keys, syntax, file existence, case, project base and path boundaries; full Astro compilation remains required |

**Confirmed regression:** commit `559caf6` saved `experience: [ {} ]`. Native optional-object preprocessing accepts an entirely empty row before checking its required children. The same gap exists for optional Place/Trip rows. Setting the parent list to required would also forbid an empty list; that is not the intended behavior. Empty optional arrays are valid, but every added row must be complete. The repository check rejects unfinished rows without deleting or sanitizing them.

The preflight shares schemas with Astro (`src/schemas/content.ts`), checks drafts too, and reports source file, field path and corrective action. The actual configured Astro Markdown parser is reused without adding dependencies. A production build additionally catches component imports, image processing failures and other compilation errors. Dynamic MDX media expressions produce a preflight warning and require rendered verification. Remote resources are not availability-tested; valid syntax does not guarantee editorial accuracy, accessibility or every runtime link. Body image SVG/GIF references remain supported; Gallery and Place image fields retain their existing raster formats.

## Hosted pre-save gap: still unresolved

The owner's hosted test after `d7c26ba` saved an empty Experience row in commit `c95b63e`. **CMS Save validation is not fixed.** GitHub validation and deployment protection are separate, post-save safeguards. No authenticated editor interaction by the coding agent is claimed.

The inspected official main revision remains `6f4e860a35d934406580287e7042e5e111e207a1`. Its [form resolver](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/components/entry/entry-form.tsx#L1045) and save API share `generateZodSchema`:

1. The editor creates `{start: "", end: ""}`. The form's submit callback sends raw `form.getValues()` after its resolver accepts them.
2. [Optional-object preprocessing](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/lib/schema.ts#L158) turns the entirely empty row into `undefined` before required children run. The object schema is wrapped in an array afterward, so this behavior applies to each row. A partly completed row is validated and its missing child fails.
3. The [save API](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/app/api/%5Bowner%5D/%5Brepo%5D/%5Bbranch%5D/files/%5Bpath%5D/route.ts#L98) repeats the same acceptance. `deepMap` rebuilds the absent row into an object with undefined children; JSON conversion and sanitization leave `{}` in the array. YAML serialization writes `- {}`.

There is no verified configuration-only pre-save rule for **an optional object list whose existing items must be complete** in this version. Parent `required: true` validates children but unconditionally imposes at least one item; `list.min: 0` cannot undo that. A minimum list count does not inspect row completeness. Patterns apply to string/text, not objects. The internal field-component before-submit hooks are application code, not repository-configurable validators. CMS Actions run after saved Git changes and cannot intercept Save.

The smallest practical alternative keeps the current two-field rows: complete both months or explicitly remove an unfinished row **before Save**, then check Actions or run the native validation action. CMS helper text states that blank rows can save but block publication. No automatic filtering, invented default month, required dummy range, field-type migration or custom CMS is introduced. True inline prevention needs an upstream fix/feature (or separately approved application customization).

### Observed GitHub protection

[Run 43259748605](https://github.com/eliotziqi/bicycle-field-notes/actions/runs/43259748605) for `c95b63e` failed in **Validate saved source before changing metadata** with errors naming `src/content/posts/a-first-ride-testing-bicycle-field-notes.md`, `experience[0].start` and `experience[0].end`, plus instructions to complete or deliberately remove the row. Metadata, build, metadata commit and Pages artifact were skipped; deployment was skipped. The report step succeeded and uploaded [publishing-report](https://github.com/eliotziqi/bicycle-field-notes/actions/runs/43259748605/artifacts/13963696793), including the pending file and correction procedure. The previous successful deployment remained active.

Only this deliberately added test row is restored to `experience: []`; the test save contained no other changes. Future normal saves remain untouched by the safety net.

### Proposed upstream report (not submitted)

Title: **Optional object lists accept blank items despite required children**.

Minimal configuration:

```yaml
- name: experience
  type: object
  list: true
  fields:
    - name: start
      type: string
      required: true
    - name: end
      type: string
      required: true
```

Reproduce by adding an empty row and saving in the hosted editor. Expected: `[]` or an absent list is allowed, but `[{}]`, both blank strings and one missing child are blocked before a Git commit with row/field diagnostics. Actual: the completely blank row passes client and API validation and is saved as `- {}`. Include source revision, hosted observation, and the local upstream schema/serialization test; do not assert the hosted deployment SHA, which is unknown.

Request separate list optionality and item completeness, preserving the documented optional behavior of a single object. Cover absent/empty lists, blank/partial/complete rows, repeated ordered rows and direct API submissions. Do not silently drop rows as a fix. Mention [issue 188](https://github.com/hunvreus/pagescms/issues/188), which addressed optional single objects and does not resolve this list-specific requirement. A targeted search found no exact duplicate; check again before filing. Filing an upstream issue requires owner authorization.

## Correct a failed publication

1. Open the failed run in [GitHub Actions](https://github.com/eliotziqi/bicycle-field-notes/actions). Read its summary and **publishing-report** artifact; build failures also include the build log.
2. Find the named file and field, such as `experience[0].start`. In Pages CMS on main, complete the row or deliberately remove that unfinished row. Do not recreate other saved articles or uploads.
3. Save again. The next run validates the full saved snapshot, including the other pending edits. For a temporary workflow failure, use **Validate and publish saved changes** in the CMS, or GitHub's manual workflow dispatch.
4. Check both validation/build and deployment success. Reopen the CMS entry after automatic month maintenance before editing it again, then verify the live pages.

The report compares against the last successful workflow's saved revision, conservatively including any metadata commits made by that run. If history/API access is unavailable, it lists every tracked content/media path rather than omit saved work. GitHub workflow summaries are the authoritative detailed diagnostics; the CMS action provides a convenient native trigger/status, not inline repository validation.

## Metadata and recovery guarantees

Automatic month maintenance validates current Posts before writing anything and stages all candidates before changing files. It does not remove incomplete ranges, change body bytes, rewrite Experience during normal operation or commit directly. A malformed previous revision does not prevent a corrected current entry from recovering. Manual Published/Updated overrides and month-only display remain intact.

Failed validation/build creates no automatic metadata commit. A later artifact/deployment failure can leave an already validated metadata commit saved; retrying main rebuilds it safely. Missing files are restored from Git or references deliberately corrected. Category/ID renames must update all dependents together. Do not delete saved edits to make a build pass.

## Verified and manual acceptance

Official [object-field behavior](https://pagescms.org/docs/configuration/fields/object/) and [CMS Actions](https://pagescms.org/docs/configuration/actions/) were checked against the official Pages CMS checkout `6f4e860a35d934406580287e7042e5e111e207a1` (v2.1.8). Local integration tests execute its configuration, schema and serialization helpers, including create/edit/reopen and the empty-row acceptance gap. Actions use documented `workflow_dispatch` plus `payload`; this works with the existing hosted editing model without a proposed branch workflow.

An authenticated hosted session is still required to verify the actual action button, GitHub App dispatch permission, status display and the deployed CMS version's create/save/reopen behavior. Use an isolated test repository or nonpublishing branch for intentionally invalid content. Do not add a regression record to main. Locally run `npm run validate:content`, the regression tests and `npm run build`; details are in [testing](../developer/testing.md).
