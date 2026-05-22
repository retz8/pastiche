import * as React from 'react';

export type AccordionProps =
  | { type: 'single'; value?: string; onValueChange?: (v: string) => void }
  | { type: 'multiple'; value?: string[]; onValueChange?: (v: string[]) => void };

export const Accordion = (_: AccordionProps) => null;
