import * as core from '@actions/core';
import * as github from '@actions/github';

export async function getChangedFiles(): Promise<string[]> {
  const context = github.context;
  const token = core.getInput('github_token');
  if (!token) throw new Error('GITHUB_TOKEN not set');
  const octokit = github.getOctokit(token);
  const { owner, repo } = context.repo;
  const pull_number = context.payload.pull_request?.number;
  if (!pull_number) throw new Error('Not a pull request event');
  const resp = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
    per_page: 100,
  });
  return resp.data.map((f) => f.filename);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getFileDiff(_path: string): Promise<string> {
  const context = github.context;
  const token = core.getInput('github_token');
  if (!token) throw new Error('GITHUB_TOKEN not set');
  const octokit = github.getOctokit(token as string);
  const { owner, repo } = context.repo;
  const pull_number = context.payload.pull_request?.number as number;
  const diffResp = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: 'diff' },
  });
  // Return the full diff; callers can extract relevant parts if needed.
  return diffResp.data as unknown as string;
}
