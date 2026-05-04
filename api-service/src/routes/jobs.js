import { Router } from 'express';
import { submitJob, getJob, getAllJobs, deleteJob } from '../controllers/jobController.js';

const router = Router();

router.get('/', getAllJobs);
router.post('/', submitJob);
router.get('/:id', getJob);
router.delete('/:id', deleteJob);

export default router;