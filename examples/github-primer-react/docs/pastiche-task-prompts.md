# Pastiche Task Prompts — Phase 6.5

Four prompts to run via `/pastiche` from the example app root. Run each in a separate session. Run the layout prompt first — the page prompts build on it.

---

## 0. App Layout

Build the shared app layout that wraps all pages. Model it after GitHub's repository view.

The app has a persistent global header at the top of every page. It includes the organization and repository name as a breadcrumb path (use "acme-corp / issue-tracker" as the project name), a search field, and user-facing controls on the right side.

Below the header, a horizontal navigation bar with tabs for the main sections of the repo — Code, Issues, Pull requests, Actions, Projects, Settings. The Issues tab should appear active/selected. Some tabs should show a count badge next to them.

The content area below the nav is where individual pages render. It should be centered with a max width appropriate for a productivity tool — not full-bleed, not too narrow.

This layout is shared across all pages. The three page prompts below assume it's already in place.

---

## 1. Issues List (`/issues`)

Create a worktree off main and work there, not on main directly.

Build the Issues List page at `/issues`. Model it after GitHub's real issues list.

The page lets users browse issues in a repository. At the top, a search/filter bar and a "New issue" button. Below that, Open/Closed tabs with counts so users can toggle between the two sets. The main body is the issue list — each row surfaces the issue title (linked to its detail page), any labels as colored tags, the issue number, who opened it, when, and how many comments it has. Open and closed issues should be visually distinguishable.

When no issues match the current filter, show an empty state that helps the user move forward.

Use hardcoded mock data — 8–12 issues with a mix of open/closed, varied labels, and different ages. No API calls.

---

## 2. New Issue (`/issues/new`)

Create a worktree off main and work there, not on main directly.

Build the New Issue composer page at `/issues/new`. Model it after GitHub's real new issue form.

This is a two-column layout. The main column has a title field (required) and a large body textarea for the description. The sidebar column has metadata sections — Assignees, Labels, Projects — each showing a placeholder state ("No one", "None yet") since nothing is selected. The sections are visually separated.

At the bottom of the form, a submit button and a cancel action that returns to the issues list. If the user tries to submit without a title, show a validation error.

No real persistence — submitting just navigates back to `/issues`.

---

## 3. Issue Detail (`/issues/[id]`)

Create a worktree off main and work there, not on main directly.

Build the Issue Detail page at `/issues/[id]`. Model it after GitHub's real issue detail view.

The page header shows the issue title alongside its number, plus a status indicator (open or closed) and a byline ("opened this issue 3 days ago · 4 comments").

The main content area is a conversation thread. The opening post looks like a comment — author avatar, name, timestamp, and body text. Below it, a timeline mixes follow-up comments from different users with event entries (label added, issue closed, etc.). Each comment has the same avatar/name/timestamp/body shape. Events are lighter — a small icon, a one-line description, and a timestamp.

At the bottom of the thread, a comment composer with a textarea and action buttons — "Comment" to post, and a secondary action to close or reopen the issue depending on current state.

The sidebar (right column on desktop, below on narrow) shows metadata: assigned users with avatars, labels as colored tags, and placeholder slots for Projects and Milestone.

Use hardcoded mock data matching one of the issues from the list page. Nothing needs to actually persist or function — the UI just needs to be present and correct.
