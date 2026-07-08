import * as core from '@actions/core';
import * as github from '@actions/github';
import { logInfo } from './logger';

export async function getChangedFiles(): Promise<string[]> {
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
  return resp.data.map((f) => f.filename);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getFileDiff(path: string): Promise<string> {
  const token =
    core.getInput('github_token') ||
    process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN not set');
  }

  const octokit = github.getOctokit(token);

  const { owner, repo } = github.context.repo;

  const pull_number =
    github.context.payload.pull_request?.number;

  if (!pull_number) {
    throw new Error('Pull request number not found');
  }

  // Get changed files in the PR
  const response =
    await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number,
      per_page: 100,
    });

  // Find the requested file
  const changedFile =
    response.data.find(
      file => file.filename === path
    );

  if (!changedFile) {
    logInfo(`No diff found for ${path}`);
    return "";
  }

  // patch contains only this file's diff
  return changedFile.patch || "";
}