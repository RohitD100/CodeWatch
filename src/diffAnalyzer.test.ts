/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as github from '@actions/github';
import { getChangedFiles, getFileDiff } from './diffAnalyzer';

vi.mock('@actions/github');

const mockedGetOctokit = vi.fn();
(github as any).getOctokit = mockedGetOctokit;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GITHUB_TOKEN = 'test-token';
  // Mock context
  (github as any).context = {
    repo: { owner: 'owner', repo: 'repo' },
    payload: { pull_request: { number: 123, head: { sha: 'abcd' } } }
  } as any;
});

describe('getChangedFiles', () => {
  it('returns list of filenames', async () => {
    const listFilesMock = vi.fn().mockResolvedValue({ data: [{ filename: 'src/index.ts' }, { filename: 'README.md' }] });
    mockedGetOctokit.mockReturnValue({ rest: { pulls: { listFiles: listFilesMock } } });
    const files = await getChangedFiles();
    expect(files).toEqual(['src/index.ts', 'README.md']);
    expect(listFilesMock).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', pull_number: 123, per_page: 100 });
  });
});

describe('getFileDiff', () => {
  it('returns the diff content for a given file', async () => {
    const diffContent = `diff --git a/src/index.ts b/src/index.ts\nindex e69de29..4b825dc 100644\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -0,0 +1,2 @@\n+console.log('hi');\n+`;
    const getMock = vi.fn().mockResolvedValue({ data: diffContent } as any);
    mockedGetOctokit.mockReturnValue({ rest: { pulls: { get: getMock } } });
    const diff = await getFileDiff('src/index.ts');
    expect(diff).toContain('diff --git a/src/index.ts b/src/index.ts');
  });
});
