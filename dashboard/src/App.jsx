import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Send, RefreshCw, CheckCircle, XCircle, Clock, Loader, Network, ListPlus, Activity, AlertCircle } from 'lucide-react'

const TASK_TYPES = [
  { value: 'ai.report', label: 'Report', description: 'Generate a comprehensive report on a topic' },
  { value: 'ai.summarize', label: 'Summarize', description: 'Summarize a block of text' },
  { value: 'ai.analyze', label: 'Analyze', description: 'Deep analysis of a topic or text' },
  { value: 'ai.classify', label: 'Classify', description: 'Classify text into categories' },
  { value: 'ai.extract', label: 'Extract', description: 'Extract key entities and insights' },
]

const STATUS_CONFIG = {
  pending:    { icon: Clock,        color: '#f59e0b', bg: '#fefce8', border: '#fde68a', label: 'Pending' },
  processing: { icon: Loader,       color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Processing' },
  done:       { icon: CheckCircle,  color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Done' },
  failed:     { icon: XCircle,      color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Failed' },
}

function StatsBar({ jobs }) {
  const done = jobs.filter(j => j.status === 'done').length
  const failed = jobs.filter(j => j.status === 'failed').length
  const processing = jobs.filter(j => j.status === 'processing').length
  const pending = jobs.filter(j => j.status === 'pending').length

  const stats = [
    { label: 'Total Jobs', value: jobs.length, icon: Activity, color: '#0d9488' },
    { label: 'Completed', value: done, icon: CheckCircle, color: '#10b981' },
    { label: 'Processing', value: processing + pending, icon: Loader, color: '#f59e0b' },
    { label: 'Failed', value: failed, icon: AlertCircle, color: '#ef4444' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '32px',
    }}>
      {stats.map(s => {
        const Icon = s.icon
        return (
          <div key={s.label} style={{
            background: '#fff',
            border: '1px solid #ccfbf1',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '12px',
              background: `${s.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobCard({ job, onRefresh, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
  const Icon = status.icon

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${expanded ? '#0d9488' : '#e2e8f0'}`,
      borderRadius: '14px',
      padding: '18px 20px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: expanded ? '0 4px 20px rgba(99,102,241,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: status.bg,
            border: `1px solid ${status.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={status.color} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{job.type}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', fontFamily: 'monospace' }}>
              {job.id.slice(0, 20)}...
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: 600,
            background: status.bg,
            color: status.color,
            border: `1px solid ${status.border}`,
          }}>{status.label}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {new Date(job.created_at).toLocaleTimeString()}
          </span>
          {(job.status === 'processing' || job.status === 'pending') && (
            <RefreshCw size={14} color="#0d9488" style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onRefresh(job.id); }} />
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.05em' }}>PAYLOAD</div>
            <pre style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#0d9488',
              fontFamily: 'monospace',
            }}>{JSON.stringify(job.payload, null, 2)}</pre>
          </div>

          {job.result && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' }}>RESULT</div>
                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(job.result.output) }} style={{
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  color: '#0d9488',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}>Copy</button>
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto',
                color: '#334155',
              }}>{job.result.output}</div>
            </div>
          )}

          {job.error && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', marginBottom: '6px', letterSpacing: '0.05em' }}>ERROR</div>
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ef4444',
              }}>{job.error}</div>
            </div>
          )}

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={(e) => { e.stopPropagation(); onDelete(job.id) }} style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
            }}>Delete Job</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SubmitForm({ onJobSubmitted }) {
  const [taskType, setTaskType] = useState('ai.report')
  const [input, setInput] = useState('')
  const [categories, setCategories] = useState('')
  const [priority, setPriority] = useState(0)
  const [loading, setLoading] = useState(false)

  const selectedTask = TASK_TYPES.find(t => t.value === taskType)

  const getPayload = () => {
    if (taskType === 'ai.report' || taskType === 'ai.analyze') return { topic: input }
    if (taskType === 'ai.classify') return { text: input, categories: categories.split(',').map(c => c.trim()) }
    return { text: input }
  }

  const handleSubmit = async () => {
    if (!input.trim()) return toast.error('Please enter some input')
    setLoading(true)
    try {
      const { data } = await axios.post('/jobs', {
        type: taskType,
        payload: getPayload(),
        priority,
      })
      toast.success('Job submitted successfully')
      onJobSubmitted(data.jobId)
      setInput('')
    } catch (err) {
      toast.error('Failed to submit job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #ccfbf1',
      borderRadius: '20px',
      padding: '28px',
      marginBottom: '28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ListPlus size={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Submit New Job</h2>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TASK_TYPES.map(t => (
          <button key={t.value} onClick={() => setTaskType(t.value)} style={{
            padding: '7px 16px',
            borderRadius: '99px',
            border: taskType === t.value ? 'none' : '1px solid #e2e8f0',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: taskType === t.value ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#fff',
            color: taskType === t.value ? '#fff' : '#64748b',
            transition: 'all 0.2s',
            boxShadow: taskType === t.value ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
        {selectedTask?.description}
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={taskType === 'ai.report' || taskType === 'ai.analyze' ? 'Enter a topic...' : 'Enter text...'}
        style={{
          width: '100%',
          minHeight: '100px',
          background: '#f0fdfa',
          border: '1px solid #99f6e4',
          borderRadius: '10px',
          padding: '12px 14px',
          color: '#0f172a',
          fontSize: '14px',
          resize: 'vertical',
          fontFamily: 'inherit',
          marginBottom: '14px',
          outline: 'none',
        }}
      />

      {taskType === 'ai.classify' && (
        <input
          value={categories}
          onChange={e => setCategories(e.target.value)}
          placeholder="Categories (comma separated): tech, science, politics"
          style={{
            width: '100%',
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#0f172a',
            fontSize: '14px',
            fontFamily: 'inherit',
            marginBottom: '14px',
            outline: 'none',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Priority</span>
          {[0, 1, 2].map(p => (
            <button key={p} onClick={() => setPriority(p)} style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              border: priority === p ? 'none' : '1px solid #e2e8f0',
              background: priority === p ? '#0d9488' : '#fff',
              color: priority === p ? '#fff' : '#64748b',
              fontWeight: 600, fontSize: '13px',
              cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 24px',
          background: loading ? '#99f6e4' : 'linear-gradient(135deg, #0d9488, #0f766e)',
          border: 'none',
          borderRadius: '10px',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          transition: 'all 0.2s',
        }}>
          <Send size={16} />
          {loading ? 'Submitting...' : 'Submit Job'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await axios.get('/jobs')
      setJobs(data)
    } catch (err) {
      console.error('Failed to fetch jobs', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshJob = async (id) => {
    try {
      const { data } = await axios.get(`/jobs/${id}`)
      setJobs(prev => prev.map(j => j.id === id ? data : j))
    } catch (err) {
      toast.error('Failed to refresh job')
    }
  }

  const deleteJob = async (id) => {
    try {
      await axios.delete(`/jobs/${id}`)
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Job deleted')
    } catch (err) {
      toast.error('Failed to delete job')
    }
  }
  const clearAllJobs = async () => {
  try {
    await Promise.all(jobs.map(j => axios.delete(`/jobs/${j.id}`)))
    setJobs([])
    toast.success('All jobs cleared')
  } catch (err) {
    toast.error('Failed to clear all jobs')
  }
}

  const stressTest = async () => {
  const jobs = [
     { type: 'ai.report', payload: { topic: 'The future of nuclear fusion energy' }, priority: 2 },
  { type: 'ai.analyze', payload: { topic: 'Global supply chain disruptions post COVID' }, priority: 1 },
  { type: 'ai.summarize', payload: { text: 'Artificial intelligence is rapidly transforming every industry from healthcare to finance...' }, priority: 1 },
  { type: 'ai.classify', payload: { text: 'The stock market saw significant gains today...', categories: ['finance','technology','politics','sports','science'] }, priority: 0 },
  { type: 'ai.extract', payload: { text: 'On April 15 2024, Elon Musk announced that SpaceX successfully launched the Starship rocket...' }, priority: 0 },
  { type: 'ai.report', payload: { topic: 'Impact of quantum computing on cybersecurity and encryption standards' }, priority: 2 },

  { type: 'ai.analyze', payload: { topic: 'Economic implications of global interest rate hikes on emerging markets' }, priority: 2 },

  { type: 'ai.summarize', payload: { text: 'Climate change is accelerating at an unprecedented rate due to increased greenhouse gas emissions, deforestation, and industrial activity. Governments worldwide are implementing policies to reduce carbon emissions, but global cooperation remains a challenge. Renewable energy sources such as solar and wind are gaining traction as viable alternatives to fossil fuels, but infrastructure and investment gaps still exist...' }, priority: 1 },

  { type: 'ai.classify', payload: { text: 'NASA successfully deployed a new satellite to monitor ocean temperatures and climate patterns', categories: ['space','environment','technology','health','finance'] }, priority: 1 },

  { type: 'ai.extract', payload: { text: 'On June 10 2025, Apple announced its new AI-powered chip during WWDC in California. The project involved over 2000 engineers and partnerships with TSMC. The chip is expected to revolutionize edge AI computing.' }, priority: 0 },

  { type: 'ai.report', payload: { topic: 'Ethical implications of AI surveillance in smart cities' }, priority: 2 },

  { type: 'ai.analyze', payload: { topic: 'Trends in global renewable energy adoption and investment patterns' }, priority: 1 },

  { type: 'ai.summarize', payload: { text: 'Blockchain technology has evolved beyond cryptocurrencies into areas such as supply chain management, healthcare data security, and decentralized finance. Its ability to provide transparency and immutability makes it attractive, but scalability and regulatory challenges remain significant barriers to widespread adoption...' }, priority: 1 },

  { type: 'ai.classify', payload: { text: 'The football world cup final drew over 1 billion viewers worldwide', categories: ['sports','entertainment','politics','technology'] }, priority: 0 },

  { type: 'ai.extract', payload: { text: 'Google announced a $5 billion investment in AI infrastructure in India, partnering with local startups and universities. The initiative aims to train over 1 million developers in AI technologies over the next 5 years.' }, priority: 0 },
  ];
  toast.loading('Launching 15 parallel jobs...', { duration: 3000 })

  await Promise.all(jobs.map(j =>
    axios.post('/jobs', j)
  ))
  
  toast.success('15 jobs in queue — watch them process in parallel!')
  setTimeout(() => fetchJobs(), 1000)
}

  const handleJobSubmitted = () => {
    setTimeout(() => fetchJobs(), 1000)
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div style={{
      background: '#f8fafc',
      minHeight: '100vh',
    }}>
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #ccfbf1',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Network size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>AI Task Orchestrator</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 0 3px #10b98120',
          }} />
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>System Online</span>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Task Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '15px' }}>
            Submit and monitor distributed AI inference jobs in real time
          </p>
        </div>

        <StatsBar jobs={jobs} />
        <SubmitForm onJobSubmitted={handleJobSubmitted} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'pending', 'processing', 'done', 'failed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 14px',
                borderRadius: '99px',
                border: filter === f ? 'none' : '1px solid #e2e8f0',
                background: filter === f ? '#0f172a' : '#fff',
                color: filter === f ? '#fff' : '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={stressTest} className="stress-test-button">
              <Activity size={14} />
              Stress Test
            </button>
            <button onClick={fetchJobs} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '6px 14px',
              color: '#64748b', cursor: 'pointer', fontSize: '13px',
              fontWeight: 500,
            }}>
            <button onClick={clearAllJobs} style={{
  display: 'flex', alignItems: 'center', gap: '6px',
  background: '#fff', border: '1px solid #fecaca',
  borderRadius: '8px', padding: '6px 14px',
  color: '#ef4444', cursor: 'pointer', fontSize: '13px',
  fontWeight: 600,
}}>🗑 Clear All</button>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
            {filter === 'all' ? 'No jobs yet. Submit one above.' : `No ${filter} jobs.`}
          </div>
        ) : (
          filteredJobs.map(job => <JobCard key={job.id} job={job} onRefresh={refreshJob} onDelete={deleteJob} />)
        )}
      </div>
    </div>
  )
}
