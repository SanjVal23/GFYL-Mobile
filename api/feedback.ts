
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * DEV FEEDBACK LOGS
 * This endpoint processes user feedback for bot responses.
 * In a real-world development environment, these logs are used 
 * to fine-tune Krishna's persona and accuracy.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const feedback = request.body;

  // LOG FOR DEVS ONLY
  console.log("--- DEV FEEDBACK LOG ---");
  console.log(`TIME: ${feedback.timestamp}`);
  console.log(`USER QUERY: ${feedback.userQuery}`);
  console.log(`BOT RESPONSE: ${feedback.botResponse}`);
  if (feedback.isPositive !== undefined) {
    console.log(`SENTIMENT: ${feedback.isPositive ? 'HELPFUL' : 'NOT HELPFUL'}`);
  }
  if (feedback.comment) {
    console.log(`USER COMMENT: ${feedback.comment}`);
  }
  console.log("------------------------");

  // In a local Node environment, you might append to a file:
  // fs.appendFileSync('dev_feedback.log', `${feedback.timestamp} | ${feedback.userQuery} | ${feedback.comment}\n`);

  return response.status(200).json({ status: 'ok', note: 'Logged for developer review.' });
}
