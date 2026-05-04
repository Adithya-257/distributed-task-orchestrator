import { runInference } from '../services/groqService.js';
import { saveResult, saveError, markProcessing } from '../services/resultService.js';

const jobProcessor = async (job) => {
  const { jobId, type, payload } = job.data;

  console.log(`Processing job ${jobId} of type ${type}`);

  await markProcessing(jobId);

  try {
    const result = await runInference(type, payload);
    await saveResult(jobId, result);
    console.log(`Job ${jobId} completed successfully`);
  } catch (err) {
    await saveError(jobId, err);
    console.error(`Job ${jobId} failed:`, err.message);
    throw err;
  }
};

export default jobProcessor;