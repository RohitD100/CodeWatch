import * as core from '@actions/core';
import * as github from '@actions/github';
import { createLLMProvider } from './llmClient';
import {  getChangedFilesWithPatch } from './diffAnalyzer';
import { generateReviewComments } from './reviewGenerator';
import { logInfo, logError, logWarning } from './logger';

async function run() {
  try {
    const token = core.getInput("github_token");
    if (!token) throw new Error('GITHUB_TOKEN not set');
    logInfo(`Github Token ------> ${token}`);
    const octokit = github.getOctokit(token);
    const provider = createLLMProvider();

    const changedFiles = await getChangedFilesWithPatch();
    logInfo(`Changed files: ${changedFiles.map(f => f.filename).join(', ')}`);
    // Process each file and post a single short comment directly
    const { owner, repo } = github.context.repo;
    const pull_number = github.context.payload.pull_request?.number as number;
    let postedCount = 0;
    for (const { filename, patch } of changedFiles) {
      if (!patch) {
        logWarning(`No diff found for ${filename}`);
        continue;
      }
      // Request a concise review comment for the full diff
      const fileComments = await generateReviewComments(provider, patch, filename);
      if (fileComments.length > 0) {
        const first = fileComments[0];
        const shortBody = first.body.length > 200 ? first.body.slice(0, 197) + '...' : first.body;
        await octokit.rest.pulls.createReviewComment({
          owner,
          repo,
          pull_number,
          body: shortBody,
          commit_id: github.context.payload.pull_request?.head.sha,
          path: first.path,
          line: first.line,
        });
        postedCount++;
        logInfo(`Posted short comment for ${filename}`);
      }
    }

    core.setOutput('review-comments', postedCount);
    logInfo(`Posted ${postedCount} review comments`);
  } catch (error) {
    const err = error as Error;
    logError(`Action failed: ${err.message}`);
    core.setFailed(err.message);
  }
}

run();
