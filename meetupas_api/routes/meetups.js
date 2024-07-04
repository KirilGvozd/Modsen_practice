require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const passport = require('passport');
const {meetupSchema, assignForMeetupSchema} = require('../dto/meetupSchemas');

/**
 * @swagger
 * tags:
 *   name: Meetups
 *   description: API for meetups
 */

/**
 * @swagger
 * /api/meetups:
 *   get:
 *     summary: Get a list of meetups
 *     tags: [Meetups]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by field
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of meetups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   time:
 *                     type: string
 *                     format: date-time
 *                   location:
 *                     type: string
 *                   Attendants:
 *                     type: array
 *                     items:
 *                       type: string
 */

router.get('/', async (req, res) => {
    const { search, tags, sort, page = 1, limit = 10 } = req.query;

    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (tags) {
        where.tags = { hasSome: tags.split(',') };
    }

    const meetups = await prisma.meetup.findMany({
        where,
        orderBy: sort ? { [sort]: 'asc' } : undefined,
        skip: (page - 1) * limit,
        take: +limit,
        include: {
            UsersMeetups: {
                include: {
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    const result = meetups.map(meetup => ({
        id: meetup.id,
        title: meetup.title,
        description: meetup.description,
        tags: meetup.tags,
        time: meetup.time,
        location: meetup.location,
        Attendants: meetup.UsersMeetups.map(um => um.user.name)
    }));

    res.json(result);
});


/**
 * @swagger
 * /api/meetups/{id}:
 *   get:
 *     summary: Get a meetup by ID
 *     tags: [Meetups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The meetup ID
 *     responses:
 *       200:
 *         description: Meetup details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 time:
 *                   type: string
 *                   format: date-time
 *                 location:
 *                   type: string
 *       404:
 *         description: Meetup not found
 */

router.get('/:id', async (req, res) => {
    const meetup = await prisma.meetup.findUnique({ where: { id: +req.params.id } });
    if (!meetup) return res.status(404).json({ error: 'Meetup not found' });
    res.json(meetup);
});

/**
 * @swagger
 * /api/meetups:
 *   post:
 *     summary: Create a new meetup
 *     tags: [Meetups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tags
 *               - time
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               time:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meetup created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 time:
 *                   type: string
 *                   format: date-time
 *                 location:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only organizers can create meetups
 */

router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.role !== 'ORGANIZER') {
        return res.status(403).json({ error: 'Only organizers can create meetups' });
    }
    const { error, value } = meetupSchema.validate(req.body);
    if (error) {
        return res.status(400).json({error: error.details[0].message});
    }


    const meetup = await prisma.meetup.create({
        data: {
            ...value,
            userId: req.user.id
        }
    });
    res.status(201).json(meetup);
});

/**
 * @swagger
 * /api/meetups/register:
 *   post:
 *     summary: Assign for a meetup
 *     tags: [Meetups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meetupId
 *             properties:
 *               meetupId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Successfully assigned for a meetup!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meetupId:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only users can assign for a meetup!
 */

router.post('/register', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.role !== 'USER') {
        return res.status(403).json({error: 'Only users can assign for a meetup!'});
    }
    const { error, value } = assignForMeetupSchema.validate(req.body);
    if (error) {
        return res.status(400).json({error: error.details[0].message});
    }

    if (!await prisma.meetup.findUnique({where: {id: value.meetupId,}})) {
        return res.status(404).json({error: 'There is no such meetup!'});
    }

    const assignForMeetup = await prisma.usersMeetups.create({
        data: {
            ...value,
            userId: req.user.id
        }
    });
    res.status(201).json(`Successfully assigned for a meetup!\n${assignForMeetup}`);
});

/**
 * @swagger
 * /api/meetups/{id}:
 *   put:
 *     summary: Update a meetup
 *     tags: [Meetups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The meetup ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tags
 *               - time
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               time:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meetup updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 time:
 *                   type: string
 *                   format: date-time
 *                 location:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Only organizers can update meetups
 *       404:
 *         description: Meetup not found
 */

router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const meetup = await prisma.meetup.findUnique({ where: { id: +req.params.id } });
    if (!meetup) return res.status(404).json({ error: 'Meetup not found' });
    if (meetup.userId !== req.user.id) return res.status(403).json({ error: 'You can only edit your own meetups' });

    const { error, value } = meetupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updatedMeetup = await prisma.meetup.update({
        where: { id: +req.params.id },
        data: value
    });
    res.json(updatedMeetup);
});

/**
 * @swagger
 * /api/meetups/{id}:
 *   delete:
 *     summary: Delete a meetup
 *     tags: [Meetups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The meetup ID
 *     responses:
 *       200:
 *         description: Meetup deleted
 *       403:
 *         description: Only organizers can delete meetups
 *       404:
 *         description: Meetup not found
 */

router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const meetup = await prisma.meetup.findUnique({ where: { id: +req.params.id } });
    if (!meetup) return res.status(404).json({ error: 'Meetup not found' });
    if (meetup.userId !== req.user.id) return res.status(403).json({ error: 'You can only delete your own meetups' });

    await prisma.meetup.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Meetup deleted' });
});

module.exports = router;
