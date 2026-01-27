import { Router, Request, Response } from 'express';
import { getAllPersonsData, getPersonsByRole, getPersonsByEra, getPersonData } from '../../src/lib/bible';

export const personsRouter = Router();

/**
 * GET /api/persons
 * Query params: role, era (optional filters)
 */
personsRouter.get('/', (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const era = req.query.era as string | undefined;

  try {
    let persons;

    if (role) {
      persons = getPersonsByRole(role);
    } else if (era) {
      persons = getPersonsByEra(era);
    } else {
      persons = getAllPersonsData();
    }

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(persons);
  } catch (error) {
    console.error('Error fetching persons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/persons/:id
 * Returns a specific person
 */
personsRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const person = getPersonData(id);

    if (!person) {
      res.status(404).json({ error: 'Person not found' });
      return;
    }

    res.set('Cache-Control', 'public, max-age=86400');
    res.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
