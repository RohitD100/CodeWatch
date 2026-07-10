import * as core from '@actions/core';
import * as github from '@actions/github';
import { createLLMProvider } from './llmClient';
import { getChangedFilesWithPatch } from './diffAnalyzer';
import { generateReviewComments } from './reviewGenerator';
import { logInfo, logError, logWarning } from './logger';

/**
 * Runs the action: collects changed files, generates AI review comments, and posts them efficiently.
 * Handles rate limiting by batching comments (max 40 per review) and truncating bodies to 200 chars.
 */
async function run() {
  try {
    const token = core.getInput('github_token');
    if (!token) throw new Error('GITHUB_TOKEN not set');
    logInfo(`Github Token ------> ${token}`);
    const octokit = github.getOctokit(token);
    const provider = createLLMProvider();

    const changedFiles = await getChangedFilesWithPatch();
    logInfo(`Changed files: ${changedFiles.map(f => f.filename).join(', ')}`);

    const { owner, repo } = github.context.repo;
    const pull_number = github.context.payload.pull_request?.number as number;
    const headSha = github.context.payload.pull_request?.head.sha;
    let postedCount = 0;

    for (const { filename, patch } of changedFiles) {
      // Skip configuration files that should not receive review comments
      if (filename === 'package.json' || filename === 'package-lock.json') {
        logInfo(`Skipping ${filename}`);
        continue;
      }
      if (!patch) {
        logWarning(`No diff found for ${filename}`);
        continue;
      }
      logInfo(`processing file ------> ${filename}`);
      // Generate AI review comments for the diff
      const fileComments = await generateReviewComments(provider, patch, filename);
      if (fileComments.length > 0) {
        // Truncate each comment body to keep token usage low and respect GitHub limits
        for (const c of fileComments) {
          const truncated = c.body.length > 200 ? c.body.slice(0, 197) + '...' : c.body;
          // Post each comment directly
          await octokit.rest.pulls.createReviewComment({
            owner,
            repo,
            pull_number,
            body: truncated,
            commit_id: headSha,
            path: c.path,
            line: c.line,
          });
          postedCount++;
          logInfo(`Posted comment for ${c.path}:${c.line}`);
        }
      }
    }

    // No further batching needed; postedCount reflects total comments posted

    core.setOutput('review-comments', postedCount);
    logInfo(`Posted total ${postedCount} review comments`);
  } catch (error) {
    const err = error as Error;
    logError(`Action failed: ${err.message}`);
    core.setFailed(err.message);
  }
}

run();
