require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const jwtSecret = process.env.JWT_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenExpiry = '15m';
const refreshTokenExpiry = '7d';

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('USER', 'ORGANIZER').required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: accessTokenExpiry });
    const refreshToken = jwt.sign({ id: user.id, role: user.role }, refreshTokenSecret, { expiresIn: refreshTokenExpiry });
    return { accessToken, refreshToken };
};

const saveRefreshToken = async (token, userId, role) => {
    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            role,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days from now
        },
    });
};

router.post('/register', async (req, res) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const hashedPassword = await bcrypt.hash(value.password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                ...value,
                password: hashedPassword,
            },
        });

        const { accessToken, refreshToken } = generateTokens(user);
        await saveRefreshToken(refreshToken, user.id, user.role);

        res.status(201).json({ accessToken, refreshToken });
    } catch (err) {
        res.status(400).json({ error: 'User already exists' });
    }
});

router.post('/login', async (req, res) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await prisma.user.findUnique({ where: { email: value.email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isValidPassword = await bcrypt.compare(value.password, user.password);
    if (!isValidPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const { accessToken, refreshToken } = generateTokens(user);
    await saveRefreshToken(refreshToken, user.id, user.role);

    res.json({ accessToken, refreshToken });
});

router.post('/token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required' });

    try {
        const payload = jwt.verify(refreshToken, refreshTokenSecret);
        const savedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!savedToken) return res.status(403).json({ error: 'Invalid refresh token' });

        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) return res.status(403).json({ error: 'User not found' });

        const { accessToken, newRefreshToken } = generateTokens(user);
        await saveRefreshToken(newRefreshToken, user.id, user.role);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
    }
});

router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json(req.user);
});

module.exports = router;
