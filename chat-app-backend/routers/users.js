const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const verifyToken = require('../auth/verifyJWT');

router.get('/all', verifyToken, async(req, res)=>{
    try{
        const allUsers = await User.find()
        res.json(allUsers)
    }catch(err){
        res.status(400).json({ok: false, message: err.message})
    }
})

router.post('/login', async(req, res)=>{
    try{
        const user = await User.findOne({phone: req.body.phone, password: req.body.password})
        if(user === null){
            return res.status(401).json({ok: false, message: 'Invalid Phone number and password'})
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10d' });
        const userInfo=user.toObject()
        delete userInfo.password
        res.status(201).json({userInfo, token})
    }catch(error){
        res.status(400).json({
            ok: false,
            message: error.message
        })
    } 
})

router.post('/', async(req,res)=>{
    try{
        console.log('req ', req.body)
        const user = new User({
            name: req.body.name,
            phone: req.body.phone,
            password: req.body.password
        })
        const newUser = await user.save()
        res.status(201).json(newUser)
    }catch(error){
        res.status(400).json({
            ok: false,
            message: error.message
        })
    }
})

router.get('/:id', [verifyToken, getUser], async(req, res)=>{
    res.json(res.user)
})

router.delete('/:id', verifyToken, async(req, res)=>{
    try{
        await User.findOneAndDelete({_id: req.params.id})
        res.json({message: 'User Deleted'})
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})

async function getUser(req, res, next){
    let user
    try{
        user = await User.findById(req.params.id)
        if(user===null){
            return res.status(404).json({ok: false, message: 'User not found'})
        }
        res.user = user
        next()
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = router