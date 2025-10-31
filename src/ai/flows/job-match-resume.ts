'use server';

/**
 * @fileOverview This file implements a Genkit flow to match a resume to a job description and provide feedback.
 *
 * - matchResumeToJob - A function that handles the resume matching process.
 * - MatchResumeToJobInput - The input type for the matchResumeTo-job function.
 * - MatchResumeToJobOutput - The return type for the matchResumeTo-job function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const MatchResumeToJobInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescription: z.string().describe('The job description to match the resume against.'),
});
export type MatchResumeToJobInput = z.infer<typeof MatchResumeToJobInputSchema>;

const MatchResumeToJobOutputSchema = z.object({
  relevanceScore: z
    .number()
    .describe('A score indicating the relevance of the resume to the job description (0-100).'),
  feedback: z.array(z.string()).describe('Suggestions to improve the resume for the job description.'),
});
export type MatchResumeToJobOutput = z.infer<typeof MatchResumeToJobOutputSchema>;

export async function matchResumeToJob(input: MatchResumeToJobInput): Promise<MatchResumeToJobOutput> {
  return matchResumeToJobFlow(input);
}

const matchResumeToJobPrompt = ai.definePrompt({
  name: 'matchResumeToJobPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: {schema: MatchResumeToJobInputSchema},
  output: {schema: MatchResumeToJobOutputSchema},
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are a career advisor specializing in resume optimization.

  Given a resume and a job description, provide a relevance score (0-100) and suggestions to improve the resume's fit for the job.

  Resume:
  {{resumeText}}

  Job Description:
  {{jobDescription}}

  Relevance Score (0-100): Provide a single number.

  Feedback:
  Provide a list of actionable suggestions to improve the resume for this job.`,
});

const matchResumeToJobFlow = ai.defineFlow(
  {
    name: 'matchResumeToJobFlow',
    inputSchema: MatchResumeToJobInputSchema,
    outputSchema: MatchResumeToJobOutputSchema,
  },
  async input => {
    const {output} = await matchResumeToJobPrompt(input);
    return output!;
  }
);
