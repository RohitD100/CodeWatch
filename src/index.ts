import * as core from '@actions/core';
import * as github from '@actions/github';
import { createLLMProvider } from './llmClient';
import {  getChangedFilesWithPatch } from './diffAnalyzer';
import { generateReviewComments } from './reviewGenerator';
import { logInfo, logError, logWarning } from './logger';
import { ReviewComment } from './types';

async function run() {
  try {
    const token = core.getInput("github_token");
    if (!token) throw new Error('GITHUB_TOKEN not set');
    const octokit = github.getOctokit(token);
    const provider = createLLMProvider();

    const changedFiles = await getChangedFilesWithPatch();
    logInfo(`Changed files: ${changedFiles.map(f => f.filename).join(', ')}`);
    const comments: ReviewComment[] = [];

    // Process each file's diff in 50-line chunks to avoid large payloads
    for (const { filename, patch } of changedFiles) {
      if (!patch) {
        logWarning(`No diff found for ${filename}`);
        continue;
      }
      // Split the patch into chunks of 50 lines
      const lines = patch.split('\n');
      const chunkSize = 50;
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunkLines = lines.slice(i, i + chunkSize);
        const chunk = chunkLines.join('\n');
        const fileComments = await generateReviewComments(provider, chunk, filename);
        comments.push(...fileComments);
      }
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
