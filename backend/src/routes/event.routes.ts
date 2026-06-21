import { Router } from 'express';
import { EventController } from '../controllers/event.controller';

const router = Router();
const eventController = new EventController();

router.get('/', eventController.getEvents);
router.post('/', eventController.createEvent);
router.delete('/:eventId', eventController.deleteEvent);
router.put('/:eventId', eventController.updateEvent);

export default router;
