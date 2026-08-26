import { query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReportSchema, ReviewReport } from './types/report-types';
import { mcpServersConfig } from './config/mcp.config';
import {
  codeQualityAnalyzer,
  testCoverageAnalyzer,
  refactoringSuggester
} from './agents/index.js';
import { ORCHESTRATOR_PROMPT } from './prompts/index.js';
import { logger } from './utils/logger.js';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  model?: string;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private model: string;

  constructor(options: OrchestratorOptions = {}) {
    // Get model from options or environment
    const modelId = options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    this.model = this.getModelShortName(modelId);
    logger.info(`Orchestrator configured with model: ${this.model}`);
  }

  /**
   * Convert full model ID to short name
   */
  private getModelShortName(modelId: string): string {
    if (modelId.includes('sonnet')) return 'sonnet';
    if (modelId.includes('haiku')) return 'haiku';
    if (modelId.includes('opus')) return 'opus';
    return 'sonnet'; // Default
  }

  /**
   * Review a pull request using the multi-agent system
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();
    logger.info(`Starting review of ${owner}/${repo}#${prNumber}`);

    try {
      // Create the user message with PR context and orchestrator instructions
      const userMessage = `${ORCHESTRATOR_PROMPT}

---

Review the pull request #${prNumber} in the ${owner}/${repo} repository.

Follow these steps:
1. Use GitHub MCP tools to fetch the PR details and changed files
2. For each changed file, use the Task tool to invoke all three subagents:
   - Use the code-quality-analyzer agent to analyze the file
   - Use the test-coverage-analyzer agent to evaluate test coverage
   - Use the refactoring-suggester agent to identify refactoring opportunities
3. Aggregate all agent findings into a comprehensive ReviewReport

Ensure your final output is valid JSON matching the ReviewReport schema with all required fields populated.`;

      // Create async message generator
      async function* createPrompt() {
        yield {
          type: 'user' as const,
          message: {
            role: 'user' as const,
            content: userMessage
          },
          parent_tool_use_id: null,
          session_id: `review-${Date.now()}`
        };
      }

      // Execute orchestration query
      let finalOutput: ReviewReport | null = null;

      for await (const response of query({
        prompt: createPrompt(),
        options: {
          mcpServers: mcpServersConfig as any,
          agents: {
            'code-quality-analyzer': codeQualityAnalyzer,
            'test-coverage-analyzer': testCoverageAnalyzer,
            'refactoring-suggester': refactoringSuggester
          },
          allowedTools: ['Task'],
          model: this.model,
          maxTurns: 20
        }
      })) {
        // Log agent responses for debugging
        if (response.type === 'assistant') {
          const content = response.message?.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if ((block as any).type === 'tool_use') {
                logger.debug(`[Tool]: ${(block as any).name}`);
              } else if ((block as any).type === 'text') {
                // Check if text contains JSON that might be our output
                const text = (block as any).text;
                if (text && text.includes('{') && text.includes('}')) {
                  try {
                    const parsed = JSON.parse(text);
                    if (parsed.pullRequest && parsed.fileReviews !== undefined) {
                      const result = ReviewReportSchema.safeParse(parsed);
                      if (result.success) {
                        finalOutput = result.data;
                        logger.info('✓ Found valid ReviewReport in response');
                      }
                    }
                  } catch {
                    // Not JSON or not a ReviewReport
                  }
                }
              }
            }
          }
        }
      }

      // If no output was found, create a default response
      if (!finalOutput) {
        logger.warn('No ReviewReport output captured, creating default response');
        finalOutput = {
          pullRequest: { owner, repo, number: prNumber },
          fileReviews: [],
          summary: {
            totalFiles: 0,
            overallScore: 0,
            criticalIssues: 0,
            highPriorityTests: 0,
            refactoringOpportunities: 0
          },
          recommendations: [],
          metadata: {
            analyzedAt: new Date().toISOString(),
            duration: Date.now() - startTime,
            agentVersions: {
              'code-quality-analyzer': '1.0.0',
              'test-coverage-analyzer': '1.0.0',
              'refactoring-suggester': '1.0.0'
            }
          }
        };
      }

      const duration = Date.now() - startTime;
      logger.info(`✓ Review completed in ${duration}ms`);

      return finalOutput;
    } catch (error) {
      logger.error('Error during orchestrated review:', error);
      throw error;
    }
  }
}

// Export for convenience
export type { ReviewReport } from './types/report-types.js';
