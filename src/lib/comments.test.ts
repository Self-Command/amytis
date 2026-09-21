import { describe, expect, test } from 'bun:test';
import { resolveCommentable } from './comments';
import { siteConfig } from '../../site.config';

describe('resolveCommentable', () => {
  describe('frontmatter override', () => {
    test('frontmatter true overrides a false category default', () => {
      // staticPages defaults to false — explicit true must win
      expect(resolveCommentable(true, 'staticPages')).toBe(true);
    });

    test('frontmatter false overrides a true category default', () => {
      // posts defaults to true — explicit false must win
      expect(resolveCommentable(false, 'posts')).toBe(false);
    });

    test('frontmatter true wins for any category', () => {
      expect(resolveCommentable(true, 'flows')).toBe(true);
      expect(resolveCommentable(true, 'notes')).toBe(true);
      expect(resolveCommentable(true, 'bookChapters')).toBe(true);
    });

    test('frontmatter false wins for any category', () => {
      expect(resolveCommentable(false, 'flows')).toBe(false);
      expect(resolveCommentable(false, 'notes')).toBe(false);
      expect(resolveCommentable(false, 'bookChapters')).toBe(false);
    });
  });

  describe('site config category defaults (no frontmatter)', () => {
    test('posts default is true', () => {
      expect(resolveCommentable(undefined, 'posts')).toBe(siteConfig.comments.commentable.posts);
    });

    test('flows default is true', () => {
      expect(resolveCommentable(undefined, 'flows')).toBe(siteConfig.comments.commentable.flows);
    });

    test('notes default is true', () => {
      expect(resolveCommentable(undefined, 'notes')).toBe(siteConfig.comments.commentable.notes);
    });

    test('bookChapters default is true', () => {
      expect(resolveCommentable(undefined, 'bookChapters')).toBe(siteConfig.comments.commentable.bookChapters);
    });

    test('staticPages default is false', () => {
      expect(resolveCommentable(undefined, 'staticPages')).toBe(siteConfig.comments.commentable.staticPages);
    });
  });
});
