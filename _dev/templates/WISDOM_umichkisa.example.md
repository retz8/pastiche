<!-- WISDOM — atom-intrinsic rules. Hand-curated. -->
<!-- Format: `- [Tag1,Tag2,...] rule text.` (comma-separated tags inside one bracket pair). -->
<!-- Tags must match FACT.md atom names verbatim. `[GENERAL]` is the lone non-FACT tag — system-wide invariants. -->
<!-- Discipline: only atom-intrinsic rules here. Scenario-conditional rules belong in KNOWLEDGE. -->

<!-- ─── System-wide ─── -->

- [GENERAL] No dark mode — never add `.dark` classes, `prefers-color-scheme` queries, or dark-mode token layers; this DS is light-mode only.
- [GENERAL] Use semantic `--color-*` tokens for all color in component code — never raw hex, OKLCH literals, or `--primitive-*` tokens.
- [GENERAL] Use only the three layout breakpoints — default (mobile), `md:` (≥768px), `lg:` (≥1024px); never `sm:`, `xl:`, or `2xl:`.
- [GENERAL] All spacing values come from Tailwind's built-in 4px scale — never arbitrary values like `px-[24px]` or `mt-[13px]`.
- [GENERAL] Use `type-*` semantic utility classes for typography — never compose raw Tailwind text utilities for fonts.
- [.type-display,.type-h1] Paired with `tracking-tight`; every other `type-*` role uses `tracking-normal` (the default).
- [.type-display,.type-h1] Default to `type-h1` for page titles; reserve `type-display` for explicit marketing/hero spec call-outs — `type-display` is rare and overpowers most app surfaces.
- [.type-caption] The typography floor for readable body content (12px) — never use custom sizes smaller than this.
- [GENERAL] Vertical spacing tiers (`gap-2` element / `gap-4` component / `gap-6` section) do not scale across breakpoints — layout responsiveness is column reflow, not gap scaling.
- [GENERAL] Never apply weight utilities (`font-semibold`, `font-bold`) to whole text containers for emphasis — use `<strong>` for inline emphasis or a higher `type-*` class for block-level weight.
- [GENERAL] Every interactive element must have a visible focus indicator — never set `outline: none` without a replacement focus style.
- [GENERAL] Body text must meet 4.5:1 contrast (WCAG AA); large text (≥18px or 14px+ bold) and non-text UI must meet 3:1.
- [GENERAL] Pages use semantic landmark elements: `<header>`, `<nav>` (with `aria-label` if multiple), `<main id="main-content">`, `<footer>`.
- [GENERAL] Every page must include a skip link — visually hidden by default, becomes visible on `:focus-visible`, targeting `#main-content`.
- [GENERAL] The `-subtle` token suffix marks container/background roles; the `-muted` suffix marks deprioritized roles (lower-contrast text, elevated inner surfaces).

<!-- ─── Color tokens ─── -->

- [--color-brand-primary] When used as a background, foreground text must be `--color-brand-foreground` (maize) — never white.
- [--color-brand-foreground] Pairs with `--color-brand-primary` backgrounds only — never use on other surfaces.
- [--color-brand-accent] Never use as link or clickable-text color — contrast fails on white surfaces and the color does not read as interactive.
- [--color-brand-primary,--color-brand-accent] Avoid as mid-page card or content backgrounds — disrupts reading flow and feels heavy.
- [--color-info,--color-link] Resolve to the same primitive value but serve distinct semantic roles — never use interchangeably.
- [--color-link,text-link] `text-link` is a color-only utility — it provides no underline and no hover state. Inline body hyperlinks must add `underline`; standalone helper links must add at minimum `hover:underline`. Color alone is insufficient to mark interactivity (a11y).
- [--color-success] Never use as standalone text or icon color — fails AA at 2.2:1; pair with a `--color-foreground` label.
- [--color-warning] Sits at the 3.0:1 floor exactly — pair with a `--color-foreground` label, never use alone for readable content.
- [--color-error] Avoid for small body text — passes large text only at 3.9:1.
- [--color-disabled-foreground] Never use for content that must be read — intentionally below contrast thresholds.
- [--color-disabled-foreground] Disabled text uses the same `type-*` class and weight as its active state — only color shifts; never reduce size or weight to communicate disabled state.
- [--color-muted-foreground] Avoid at small text sizes on `--color-surface-subtle` (4.2:1) or `--color-surface-muted` (3.8:1) — large-text-only on those surfaces.

<!-- ─── Typography tokens ─── -->

- [--font-sejong-bold] Used only for `type-display`, `type-h1`, and the documented docs-app navigation exceptions — never below H1 in app content.
- [--font-sejong-light] Permitted only in marketing/landing decorative display text at `text-4xl` or larger paired with a Bold display line — never in app UI.
- [--font-geist-mono] Documentation-site-only — never use in `packages/web/` or client application components.

<!-- ─── Button family ─── -->

- [Button] Default `type` is `"button"`. Inside a `<form>`, set `type="submit"` explicitly on the submit button.
- [Button] Variants `primary`, `secondary`, `destructive` apply `!font-bold`; `tertiary` does not. Overriding font weight via className requires `!font-` to win specificity.
- [Button,IconButton,LinkButton] Dual-ring focus (outline + box-shadow) is built into `buttonVariants`; never override or remove it via className.
- [IconButton] `aria-label` is required by the type. Provide a phrase that names the action ("Close", "Edit profile"), not the icon ("X icon").
- [IconButton,Tooltip] When wrapping an `IconButton` in a `Tooltip` for sighted users, the tooltip content must match the `aria-label` exactly to avoid duplicate screen reader announcements.
- [LinkButton] When `disabled`, renders `<span role="link" aria-disabled="true">` instead of `<a>`; anchor-only props (e.g. `href`, `target`) are dropped in this branch.
- [Button,IconButton,LinkButton] Do not wrap or re-export to add default props or rename (e.g. no `MyButton`); this creates a shadow component layer that drifts from the DS.

<!-- ─── Form controls ─── -->

- [Input,Textarea,Select,Checkbox,Switch,RadioItem] Focus state is a `--color-brand-primary` border-color change (no dual-ring); the simplified pattern is built in — never override or remove `:focus-visible` styles.
- [Checkbox,Switch,RadioItem] Use the `text` string prop for inline label text — never pass label content as children or via external markup.
- [Checkbox,Switch,RadioItem] Inline label uses `type-body-sm text-foreground`; `Switch size="sm"` uses `type-caption`.
- [Checkbox,Switch,RadioItem] Checked-state styling is built in — `--color-brand-primary` background, `--color-brand-foreground` (maize) for stroke marks (checkmarks), `--color-surface` (white) for fill marks (radio dots, switch thumbs); do not override.
- [FormItem] Vertical label-above-control layout only — toggle controls compose as children, with the toggle's `text` prop providing the inline description and `FormItem` providing the field heading.
- [FormItem] Description and error text are wired via `aria-describedby` on the control, with IDs `{htmlFor}-description` and `{htmlFor}-error` — wire this manually.
- [FormItem,Label] Use `htmlFor` for native form elements (Input, Textarea); use `aria-labelledby` referencing the auto-generated `{htmlFor}-label` for non-native triggers (Select, RadioGroup).
- [SelectItem,DropdownItem] Hover/focus background is `--color-brand-accent-subtle` and selected-item indicator color is `--color-brand-primary` — built in; never override.

<!-- ─── Layout ─── -->

- [Container] Encapsulates the page-shell pattern (`mx-auto w-full max-w-screen-2xl p-4 md:p-6 lg:p-8`) — never recompose these utilities by hand.
- [Container] Never nest — each page region gets at most one Container.
- [Grid] Uses the three-tier gap system (`element` / `component` / `section`) with `component` (16px) as default.

<!-- ─── Iconography ─── -->

- [Icon] Wraps Lucide icons exclusively — never inline raw SVG, import from `react-icons`, use emoji, or use raster images for iconography.
- [Icon] Custom icons must be added to the registry by the DS owner — never inline custom SVGs in component code.
- [Icon] Never put complex illustrations through Icon — use `<img>` or a dedicated inline SVG component for those.
- [Icon] Pass Lucide names in exact kebab-case as shown on lucide.dev — never camelCase or PascalCase.
- [Icon] Use the `size` prop from the 5-step scale (`xs`/`sm`/`md`/`lg`/`xl`) — never override icon dimensions with font-size or arbitrary CSS.
- [Icon] The `xl` size (32px) is the hard ceiling — for hero / feature-state marks (success screens, empty-state confirmations), do not bypass with className overrides or wrapper sizing. If a larger iconographic mark is required, raise as a DS gap (dedicated illustration atom or extended scale step) — never wrap and resize.
- [Icon] `className` is for layout utilities only (`block`, `flex-shrink-0`); never pass color or sizing classes via `className`.
- [Icon] Color is inherited via `currentColor` from the parent — control icon color through the parent element's text-color token.
- [Icon] Omit `label` for decorative icons (rendered with `aria-hidden="true"`); provide `label` only when the icon is the sole indicator of meaning.
- [Icon] Never provide `label` when the wrapper button or link already has `aria-label` — duplicates screen reader announcements.
- [Icon] Never attach event handlers (e.g. `onClick`) directly — SVGs have no button role and aren't keyboard-reachable; wrap in a button or anchor.
- [Icon] Never apply breakpoint prefixes (`md:`, `lg:`) to size — icon size is determined by component context, not viewport.
- [Icon] When making an icon interactive, the wrapping button or link must be at least 44×44px to meet the touch-target minimum.
- [Icon] Semantic icons (with `label`) must meet 3:1 non-text contrast; decorative icons (`aria-hidden`) have no contrast requirement.

<!-- ─── Composition contracts (FACT-derived) ─── -->

- [Accordion,AccordionItem,AccordionTrigger,AccordionContent] Compose strictly as `Accordion > AccordionItem > (AccordionTrigger, AccordionContent)` — never substitute raw elements for any of the four pieces.
- [Tabs,TabsList,TabsTrigger,TabsContent] Compose as `Tabs > (TabsList > TabsTrigger…) + TabsContent…` — TabsList wraps every TabsTrigger; TabsContent is a sibling of TabsList under Tabs. **Co-locate the entire compound in the same file as the `<Tabs>` root.** Do not split `TabsList` or `TabsContent` into separate child components imported from elsewhere — although React context theoretically propagates through any depth, in practice this triggers "Tabs compound components must be used within `<Tabs>`" runtime errors. If a panel's content is large, extract the panel's *children* into their own component, but keep the `TabsContent` element itself in the file that renders `<Tabs>`.
- [Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogFooter,DialogClose] Compose using the named subcomponents — every Dialog must include a `DialogTitle` (or `aria-labelledby` equivalent on `DialogContent`) for the accessible name.
- [Dropdown,DropdownTrigger,DropdownContent,DropdownItem,DropdownGroup,DropdownSeparator] Compose strictly with the named subcomponents — never wrap raw buttons or list items inside `DropdownContent`.
- [Popover,PopoverTrigger,PopoverContent] Compose strictly as `Popover > PopoverTrigger + PopoverContent`; the trigger and content components are paired and not used independently.
- [Select,SelectTrigger,SelectContent,SelectItem,SelectGroup,SelectSeparator] Compose strictly with the named subcomponents — never substitute raw `<select>`/`<option>` markup.
- [Form.Select] Renders only the Select root — unlike Form.Input/Textarea/Checkbox/Radio/Switch/DatePicker, it does **not** encapsulate the trigger and content. Consumer must pass `<SelectTrigger placeholder=… />` and `<SelectContent>{<SelectItem>…}</SelectContent>` as children. Passing bare `<SelectItem>` children throws "SelectItem must be used within SelectContent" at runtime.
- [RadioGroup,RadioItem] RadioItem appears only as a child of RadioGroup — never standalone.
- [Card,CardHeader,CardTitle,CardDescription,CardContent,CardFooter] Compose with the named subcomponents — Card distinction comes from its border, not from a tinted background.
- [Table,TableHeader,TableBody,TableRow,TableHead,TableCell,TableCaption,TableFooter] Compose with the named subcomponents — never substitute raw `<table>`/`<tr>`/`<td>` markup.
- [Table,TableMobileList] Every table ships both representations — desktop `Table` (wrapped `hidden md:block`) and mobile `TableMobileList` (wrapped `block md:hidden`); desktop-only tables are incomplete.
- [TableMobileList,TableMobileItem] TableMobileItem appears only as a child of TableMobileList — never standalone.
- [Sheet,SheetContent] Sheet is mobile-only. For responsive overlays use Dialog.
- [Sheet,SheetContent] Drag-to-dismiss is part of the atom — consumers do not implement custom dismissal gestures.
- [Sheet,SheetContent,SheetTitle] Sheet content must declare a `SheetTitle` (wrap in `VisuallyHidden` if not visually shown).
