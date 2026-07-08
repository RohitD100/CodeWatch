import * as core from '@actions/core';
import * as github from '@actions/github';
import { createLLMProvider } from './llmClient';
import { getChangedFiles, getFileDiff } from './diffAnalyzer';
import { generateReviewComments } from './reviewGenerator';
import { logInfo, logError, logWarning } from './logger';
import { ReviewComment } from './types';

async function run() {
  try {
    const token = core.getInput("github_token");
    if (!token) throw new Error('GITHUB_TOKEN not set');
    const octokit = github.getOctokit(token);
    const provider = createLLMProvider();

    const files = await getChangedFiles();
    logInfo(`Changed files: ${files.join(', ')}`);
    const comments: ReviewComment[] = [];

    for (const file of files) {
      const diff = await getFileDiff(file);
      if (!diff) {
        logWarning(`No diff found for ${file}`);
        continue;
      }
      const fileComments = await generateReviewComments(provider, diff, file);
      comments.push(...fileComments);
    }

    const { owner, repo } = github.context.repo;
    const pull_number = github.context.payload.pull_request?.number as number;
    for (const comment of comments) {
      await octokit.rest.pulls.createReviewComment({
        owner,
        repo,
        pull_number,
        body: comment.body,
        commit_id: github.context.payload.pull_request?.head.sha,
        path: comment.path,
        line: comment.line
      });
    }

    core.setOutput('review-comments', comments.length);
    logInfo(`Posted ${comments.length} review comments`);
  } catch (error) {
    const err = error as Error;
    logError(`Action failed: ${err.message}`);
    core.setFailed(err.message);
  }
}

run();
