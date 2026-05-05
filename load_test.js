import axios from 'axios';

const API_URL = 'http://localhost:3000';
const TOTAL_JOBS = 500;

const TASK_TYPES = [
  { type: 'ai.report',    payload: { topic: 'Impact of AI on healthcare' } },
  { type: 'ai.analyze',   payload: { topic: 'Global supply chain resilience' } },
  { type: 'ai.summarize', payload: { text: 'Artificial intelligence is transforming industries at unprecedented pace. Machine learning models are becoming more capable each year.' } },
  { type: 'ai.classify',  payload: { text: 'Stock markets surged today on positive earnings reports', categories: ['finance', 'technology', 'politics', 'sports'] } },
  { type: 'ai.extract',   payload: { text: 'On April 15 2024, SpaceX launched Starship from Boca Chica Texas, supported by a team of 3000 engineers.' } },
]

const submitJob = async (i) => {
  const task = TASK_TYPES[i % TASK_TYPES.length]
  return axios.post(`${API_URL}/jobs`, {
    ...task,
    priority: Math.floor(Math.random() * 3),
  })
}

const waitForCompletion = async (jobId, timeout = 300000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const { data } = await axios.get(`${API_URL}/jobs/${jobId}`)
    if (data.status === 'done' || data.status === 'failed') return data.status
    await new Promise(r => setTimeout(r, 2000))
  }
  return 'timeout'
}

const runLoadTest = async () => {
  console.log(`\n🚀 Starting load test: ${TOTAL_JOBS} jobs\n`)
  
  // Phase 1 — Submit all jobs
  console.log('📤 Submitting jobs...')
  const submitStart = Date.now()
  
  const submissions = await Promise.allSettled(
    Array.from({ length: TOTAL_JOBS }, (_, i) => submitJob(i))
  )
  
  const submitDuration = ((Date.now() - submitStart) / 1000).toFixed(2)
  const submitted = submissions.filter(r => r.status === 'fulfilled')
  const submitFailed = submissions.filter(r => r.status === 'rejected')
  const jobIds = submitted.map(r => r.value.data.jobId)

  console.log(`✅ Submitted ${submitted.length}/${TOTAL_JOBS} jobs in ${submitDuration}s`)
  console.log(`❌ Failed to submit: ${submitFailed.length}`)
  console.log(`📊 Submission rate: ${(submitted.length / submitDuration).toFixed(1)} jobs/sec\n`)

  // Phase 2 — Wait for completion
  console.log('⏳ Waiting for workers to process jobs...')
  const processStart = Date.now()

  const results = await Promise.all(jobIds.map(id => waitForCompletion(id)))

  const processDuration = ((Date.now() - processStart) / 1000).toFixed(2)
  const done = results.filter(r => r === 'done').length
  const failed = results.filter(r => r === 'failed').length
  const timedOut = results.filter(r => r === 'timeout').length
  const completionRate = ((done / TOTAL_JOBS) * 100).toFixed(1)
  const throughput = (done / processDuration).toFixed(2)

  // Phase 3 — Print report
  console.log('\n📋 LOAD TEST RESULTS')
  console.log('═══════════════════════════════')
  console.log(`Total jobs submitted  : ${TOTAL_JOBS}`)
  console.log(`Successfully enqueued : ${submitted.length}`)
  console.log(`Completed (done)      : ${done}`)
  console.log(`Failed (DLQ captured) : ${failed}`)
  console.log(`Timed out             : ${timedOut}`)
  console.log(`Completion rate       : ${completionRate}%`)
  console.log(`Worker throughput     : ${throughput} jobs/sec`)
  console.log(`Total processing time : ${processDuration}s`)
  console.log('═══════════════════════════════\n')
}

runLoadTest().catch(console.error)