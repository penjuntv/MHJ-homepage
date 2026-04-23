'use client';
import ColumnLayoutTemplate from './ColumnLayoutTemplate';
import type { NewTemplateProps } from './shared';

export default function RightTemplate(props: NewTemplateProps) {
  return <ColumnLayoutTemplate {...props} imageSide="right" />;
}
