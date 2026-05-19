import { describe, it, expect } from 'vitest';
import { isValidFileName, getUniqueName } from './name.validator';

describe('name.validator', () => {
  describe('isValidFileName', () => {
    it('rejects empty strings', () => {
      expect(isValidFileName('')).toBe(false);
      expect(isValidFileName('   ')).toBe(false);
    });

    it('rejects reserved characters', () => {
      expect(isValidFileName('my/file')).toBe(false);
      expect(isValidFileName('my\\file')).toBe(false);
      expect(isValidFileName('my:file')).toBe(false);
      expect(isValidFileName('my*file')).toBe(false);
      expect(isValidFileName('my?file')).toBe(false);
      expect(isValidFileName('my"file')).toBe(false);
      expect(isValidFileName('my<file')).toBe(false);
      expect(isValidFileName('my>file')).toBe(false);
      expect(isValidFileName('my|file')).toBe(false);
    });

    it('rejects . and ..', () => {
      expect(isValidFileName('.')).toBe(false);
      expect(isValidFileName('..')).toBe(false);
    });

    it('accepts valid names', () => {
      expect(isValidFileName('New Folder')).toBe(true);
      expect(isValidFileName('file.txt')).toBe(true);
      expect(isValidFileName('.hidden')).toBe(true);
    });
  });

  describe('getUniqueName', () => {
    it('returns the same name if no duplicates exist', () => {
      expect(getUniqueName('New Folder', ['Other Folder'], true)).toBe('New Folder');
    });

    it('appends a counter if a duplicate folder exists', () => {
      expect(getUniqueName('New Folder', ['New Folder'], true)).toBe('New Folder (1)');
      expect(getUniqueName('New Folder', ['New Folder', 'New Folder (1)'], true)).toBe('New Folder (2)');
    });

    it('handles files by preserving the extension', () => {
      expect(getUniqueName('file.txt', ['file.txt'], false)).toBe('file (1).txt');
      expect(getUniqueName('file.txt', ['file.txt', 'file (1).txt'], false)).toBe('file (2).txt');
    });

    it('handles files without extensions', () => {
      expect(getUniqueName('file', ['file'], false)).toBe('file (1)');
    });
  });
});
