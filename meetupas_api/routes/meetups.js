require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const passport = require('passport');

const meetupSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    time: Joi.date().required(),
    location: Joi.string().required(),
});

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
    });

    res.json(meetups);
});

router.get('/:id', async (req, res) => {
    const meetup = await prisma.meetup.findUnique({ where: { id: +req.params.id } });
    if (!meetup) return res.status(404).json({ error: 'Meetup not found' });
    res.json(meetup);
});

router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.role !== 'ORGANIZER') {
        return res.status(403).json({ error: 'Only organizers can create meetups' });
    }
    const { error, value } = meetupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const meetup = await prisma.meetup.create({
        data: {
            ...value,
            userId: req.user.id
        }
    });
    res.status(201).json(meetup);
});

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

router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const meetup = await prisma.meetup.findUnique({ where: { id: +req.params.id } });
    if (!meetup) return res.status(404).json({ error: 'Meetup not found' });
    if (meetup.userId !== req.user.id) return res.status(403).json({ error: 'You can only delete your own meetups' });

    await prisma.meetup.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Meetup deleted' });
});

module.exports = router;
