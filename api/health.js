// api/health.js
// Lightweight health-check endpoint for cron-job.org to ping every 3-4 days.

export default async function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'andaman-tourism',
    timestamp: new Date().toISOString(),
  });
}
