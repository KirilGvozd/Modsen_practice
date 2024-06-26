const Joi = require("joi");
const meetupSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    time: Joi.date().required(),
    location: Joi.string().required(),
});

const assignForMeetupSchema = Joi.object({
    meetupId: Joi.number().required(),
});

module.exports = { meetupSchema, assignForMeetupSchema };