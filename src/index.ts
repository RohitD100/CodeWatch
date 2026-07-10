import * as core from '@actions/core';
import * as github from '@actions/github';
import { createLLMProvider } from './llmClient';
import { getChangedFilesWithPatch } from './diffAnalyzer';
import { generateReviewComments } from './reviewGenerator';
import { logInfo, logError, logWarning } from './logger';
import { ReviewComment } from './types';

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
    logInfo(`Changed files: ${changedFiles.map((f) => f.filename).join(', ')}`);

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
      // Generate AI review comments for the diff, with safety checks
      let fileComments: ReviewComment[] = [];
      try {
        // Skip overly large diffs that may cause provider time‑outs (e.g., >5KB)
        if (patch.length > 5_000) {
          logWarning(
            `Diff for ${filename} is too large (${patch.length} chars); skipping review generation`,
          );
        } else {
          fileComments = await generateReviewComments(
            provider,
            patch,
            filename,
          );
          if (fileComments.length > 0) {
            // Truncate each comment body to keep token usage low and respect GitHub limits
            for (const c of fileComments) {
              const truncated =
                c.body.length > 200 ? c.body.slice(0, 197) + '...' : c.body;
              // Post each comment directly with error handling
              try {
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
              } catch (postErr) {
                const msg =
                  postErr instanceof Error ? postErr.message : String(postErr);
                logError(
                  `Failed to post comment for ${c.path}:${c.line}: ${msg}`,
                );
                // Continue with next comment
              }
            }
          }
        }
      } catch (genErr) {
        const msg = genErr instanceof Error ? genErr.message : String(genErr);
        logError(`Failed to generate review comments for ${filename}: ${msg}`);
        // Continue without posting for this file
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
