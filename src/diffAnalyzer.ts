import * as core from '@actions/core';
import * as github from '@actions/github';

// New helper to get filenames with their patches
export async function getChangedFilesWithPatch(): Promise<{filename: string; patch?: string}[]> {
  const context = github.context;
  const token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
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
  return resp.data.map((f) => ({ filename: f.filename, patch: f.patch }));
}