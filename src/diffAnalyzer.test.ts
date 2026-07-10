/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as github from '@actions/github';
import { getChangedFilesWithPatch } from './diffAnalyzer';

vi.mock('@actions/github');
vi.mock('@actions/core', () => ({
  getInput: vi.fn().mockReturnValue(''),
}));

const mockedGetOctokit = vi.fn();
(github as any).getOctokit = mockedGetOctokit;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.GITHUB_TOKEN = 'test-token';
  (github as any).context = {
    repo: { owner: 'owner', repo: 'repo' },
    payload: { pull_request: { number: 123, head: { sha: 'abcd' } } },
  } as any;
});

describe('getChangedFilesWithPatch', () => {
  it('returns filenames with optional patches', async () => {
    const listFilesMock = vi.fn().mockResolvedValue({
      data: [
        { filename: 'src/index.ts', patch: 'diff --git a/src/index.ts b/src/index.ts' },
        { filename: 'README.md' },
      ],
    });
    mockedGetOctokit.mockReturnValue({ rest: { pulls: { listFiles: listFilesMock } } });
    const result = await getChangedFilesWithPatch();
    expect(result).toEqual([
      { filename: 'src/index.ts', patch: 'diff --git a/src/index.ts b/src/index.ts' },
      { filename: 'README.md', patch: undefined },
    ]);
    expect(listFilesMock).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 123,
      per_page: 100,
    });
  });
});
