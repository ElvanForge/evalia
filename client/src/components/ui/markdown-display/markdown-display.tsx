import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownDisplayProps {
  content: string;
  className?: string;
}

function processMarkdown(markdown: string): string {
  let html = markdown;
  
  // Headers (h1, h2, h3)
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  // Convert unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Convert ordered lists
  html = html.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n*)+/g, function(match) {
    if (match.includes('<ul>')) return match; // Don't convert if already in a <ul>
    return '<ol>' + match + '</ol>';
  });
  
  // Paragraphs (handle double newlines)
  html = html.replace(/\n\s*\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Clean up excessive paragraph tags around lists
  html = html.replace(/<p>(<ul>|<ol>)/g, '$1');
  html = html.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1');
  
  // Convert newlines to breaks
  html = html.replace(/\n(?!((<\/?(ul|ol|li|p|h1|h2|h3|blockquote)>)|$))/g, '<br />');
  
  // Fix paragraph tags
  html = html.replace(/<p><\/p>/g, '');
  
  return html;
}

export function MarkdownDisplay({ content, className }: MarkdownDisplayProps) {
  const processedContent = processMarkdown(content);
  
  return (
    <div 
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

export default MarkdownDisplay;