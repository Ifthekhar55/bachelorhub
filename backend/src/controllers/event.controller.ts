import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../prisma';

export class EventController {
  getEvents = async (req: Request, res: Response) => {
    try {
      const events = await prisma.communityEvent.findMany({
        orderBy: { date: 'asc' },
      });

      res.json({ events });
    } catch (error) {
      console.error('Get community events error:', error);
      res.status(500).json({ error: 'Failed to fetch community events' });
    }
  };

  createEvent = async (req: Request, res: Response) => {
    try {
      const { title, description, date, location, organizer, organizerId } = req.body;

      if (!title || !date || !location || !organizer || !organizerId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const event = await prisma.communityEvent.create({
        data: {
          id: uuidv4(),
          title,
          description: description || null,
          date: new Date(date),
          location,
          organizer,
          organizerId,
        },
      });

      res.status(201).json(event);
    } catch (error) {
      console.error('Create community event error:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  };

  deleteEvent = async (req: Request, res: Response) => {
    try {
      const eventIdParam = req.params.eventId;
      const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

      const event = await prisma.communityEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      await prisma.communityEvent.delete({
        where: { id: eventId },
      });

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Delete community event error:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  };

  updateEvent = async (req: Request, res: Response) => {
    try {
      const eventIdParam = req.params.eventId;
      const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
      const { title, description, date, location, organizer } = req.body;

      const event = await prisma.communityEvent.update({
        where: { id: eventId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(date && { date: new Date(date) }),
          ...(location && { location }),
          ...(organizer && { organizer }),
        },
      });

      res.json(event);
    } catch (error) {
      console.error('Update community event error:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  };
}
