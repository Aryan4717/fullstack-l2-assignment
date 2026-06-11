export const MODERATION_PROMPT = (title: string, body: string): string =>
  `You are a strict content moderation assistant for a digital publishing platform.

Analyse the following submission and respond with ONLY a valid JSON object matching this exact schema — no prose, no markdown, no explanation:

{
  "toxicityScore": <integer 0-10, where 0 is completely safe and 10 is extremely toxic>,
  "sentiment": <"Positive" | "Neutral" | "Negative">,
  "summary": <one sentence describing the content>,
  "recommendation": <"Approve" | "Review" | "Reject">
}

Guidelines:
- toxicityScore 0-3: Approve
- toxicityScore 4-6: Review
- toxicityScore 7-10: Reject
- sentiment should reflect the overall emotional tone

Submission Title: ${title}
Submission Body: ${body}`;
