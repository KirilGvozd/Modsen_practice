require('dotenv').config();
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const {registerSchema, loginSchema} = require('../dto/authSchemas');

const jwtSecret = process.env.JWT_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenExpiry = '15m';
const refreshTokenExpiry = '7d';

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
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for users
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [USER, ORGANIZER]
 *     responses:
 *       201:
 *         description: The user was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Bad request
 */

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

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid email or password
 */

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

/**
 * @swagger
 * /api/users/token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Refresh token is required
 *       403:
 *         description: Invalid refresh token
 */

router.post('/token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
    }

    try {
        const payload = jwt.verify(refreshToken, refreshTokenSecret);
        const savedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!savedToken) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }

        await prisma.refreshToken.delete({ where: { token: refreshToken } });

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        await saveRefreshToken(newRefreshToken, user.id, user.role);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
    }
});


/**
 * @swagger
 * /api/users/info:
 *   get:
 *     summary: Get current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [USER, ORGANIZER]
 */

router.get('/info', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json(req.user);
});

router.get('/:id', async (req, res) => {
    const user = await prisma.user.findUnique({where: { id: +req.params.id } });
    if (!user) {
        return res.status(404).json({error: 'User not found'});
    }

    res.status(200).json(user);
});

module.exports = router;