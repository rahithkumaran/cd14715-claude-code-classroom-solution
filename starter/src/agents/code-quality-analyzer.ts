import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts';

/**
 * Code Quality Analyzer Agent
 * Analyzes code for quality issues, anti-patterns, and best practice violations
 */
export const codeQualityAnalyzer: AgentDefinition = {
  description: 'Analyzes code quality, security, performance, and best practices. Returns structured findings with severity levels and specific line numbers.',
  prompt: CODE_QUALITY_ANALYZER_PROMPT,
  tools: ['Skill'],
  model: 'inherit' // Inherit model from orchestrator
};
