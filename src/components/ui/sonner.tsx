'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

export const Toaster = (props: ToasterProps) => (
  <Sonner
    richColors
    position={props.position ?? 'bottom-center'}
    {...props}
  />
);
