'use client';
import ColumnLayoutTemplate from './ColumnLayoutTemplate';
import type { NewTemplateProps } from './shared';

export default function LeftTemplate(props: NewTemplateProps) {
  return <ColumnLayoutTemplate {...props} imageSide="left" />;
}
