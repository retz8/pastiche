<!-- Fixture for tests/grep-wisdom.sh. Covers every FACT-identifier tag shape pastiche supports:
     - bare word (component, GENERAL)
     - --prefix (CSS-var token)
     - .prefix (dotted-class token)
     - namespaced (Form.Input)
     Tag positions: alone, comma-first, comma-mid, comma-last.
     Substring traps: ButtonGroup vs Button. -->

- [GENERAL] system-wide rule alpha.
- [Button] component, alone.
- [Button,Avatar] component, comma-first.
- [Card,Button] component, comma-last.
- [Card,Button,Avatar] component, comma-mid.
- [ButtonGroup] substring trap — should NOT match Button.
- [ButtonGroup,Card] substring trap with comma-first.
- [Card,ButtonGroup] substring trap with comma-last.
- [--color-brand-primary] css-var, alone.
- [--color-foreground,Button] css-var, comma-first.
- [Card,--color-surface] css-var, comma-last.
- [Card,--color-surface,Button] css-var, comma-mid.
- [.type-h1] dotted-class, alone.
- [.type-h1,Button] dotted-class, comma-first.
- [Card,.type-display] dotted-class, comma-last.
- [Form.Input] namespaced component, alone.
- [Form.Input,Card] namespaced, comma-first.
- [Card,Form.Input,Button] namespaced, comma-mid.
- [GENERAL,Button,--color-error,.type-caption,Form.Select] mixed shapes — should match each.
