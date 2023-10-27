const express = require('express')
const router = express.Router()
const GroupChat = require('../models/groupChatModel')
const User = require('../models/userModel')
const verifyToken = require('../auth/verifyJWT')



router.get('/all', verifyToken, async(req, res)=>{
    try{
        const allGroups = await GroupChat.find()
        .populate({path: 'members.userId', select: ['name', 'phone']})
        .populate({path: 'chats.userId', select: ['name', 'phone']})
        .populate({path: 'admin', select: ['name', 'phone']})
        res.json(allGroups)
    }catch(err){
        res.status(400).json({ok: false, message: err.message})
    }
})

router.post('/', verifyToken, async(req,res)=>{
    try{
        const userId = req.authUser.id
        const group = new GroupChat({
            name: req.body.name,
            admin: userId
        })
        const newGroup = await group.save()
        res.status(201).json(newGroup)
    }catch(error){
        res.status(400).json({
            ok: false,
            message: error.message
        })
    }
})

router.delete('/:id', verifyToken, async(req, res)=>{
    try{
        await GroupChat.findOneAndDelete({_id: req.params.id})
        res.json({message: 'Group Deleted'})
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})

router.get('/:groupId/nonparticipents', [verifyToken], async (req, res) => {
    try {
        const groupChat = await GroupChat.findById(req.params.groupId, 'members.userId')
        const memberUserIds = groupChat.members.map((member) => member.userId);
        memberUserIds.push(req.authUser.id)
        const userList = await User.find({ _id: { $nin: memberUserIds } }, ['name', 'phone'])
        // return res.json(groupMembers)
        
        res.status(201).json(userList)
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message })
    }
})

router.delete('/:id/member/:userId', [verifyToken, getGroup], async(req, res)=>{
    try {
        await GroupChat.updateOne(
            { _id: req.params.id },
            {
                $pull: {'members': {userId: req.params.userId}}
            }
        )
        res.status(201).json({message: 'member removed'})
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})


router.patch('/:groupId/chat', verifyToken, async(req, res)=>{
    try {
        const userId = req.authUser.id
        const data = await GroupChat.findOneAndUpdate(
            { _id: req.params.groupId },
            {
                $push: {
                    chats: {
                        userId: userId,
                        message: req.body.message
                    }
                }
            },
            {new: true}
        ).populate({path: 'members.userId', select: ['name', 'phone']})
        .populate({path: 'chats.userId', select: ['name', 'phone']})
        .populate({path: 'admin', select: ['name', 'phone']})
        // const chatData = await GroupChat.
        res.status(201).json(data)
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})

router.delete('/:id/chat/:messageId', [verifyToken, getGroup], async (req, res) => {
    try {
        const userId = req.authUser.id
        const data = await GroupChat.updateOne(
            { _id: req.params.id },
            {
                $pull: {
                    chats: {
                        _id: req.params.messageId,
                        userId: userId
                    }
                }
            },
        )
        res.status(201).json({ messaged: 'messaged deleted', data })
    } catch (err) {
        res.status(500).json({ ok: false, message: err.message })
    }
})

router.get('/mygroups', verifyToken, async(req, res)=>{
    try{
        const userId = req.authUser.id
        await GroupChat.find({
            $or: [
              { admin: userId },
              { 'members.userId': userId }
            ]
        })
        .populate({path: 'members.userId', select: ['name', 'phone']})
        .populate({path: 'chats.userId', select: ['name', 'phone']})
        .populate({path: 'admin', select: ['name', 'phone']})
        .then(groupChats => {
            res.json(groupChats)
        });
    }catch(err){
        console.log('err ', err.message)
        res.status(500).json({ok: false, message: err.message})
    }
})

router.patch('/addMember', verifyToken, async (req, res) => {
    try {
        const userId = req.authUser.id
        const { memberId, groupId } = req.body
        const isMemberAlreadyExit = await GroupChat.findOne({ _id: groupId, 'members.userId': memberId })

        if (isMemberAlreadyExit) {
            return res.status(401).json({ok: false, message: 'member already exist!'})
        }

        const member = await GroupChat.findOneAndUpdate(
            { _id: groupId, admin: userId },
            {
                $push: {
                    members: {
                        userId: memberId,                       
                    },
                },
            },
            { new: true }
        )
        .populate({path: 'members.userId', select: ['name', 'phone']})
        .populate({path: 'chats.userId', select: ['name', 'phone']})
        .populate({path: 'admin', select: ['name', 'phone']})
        res.status(201).json(member)
    } catch (err) {
        console.log('err ', err.message)
        res.status(500).json({ ok: false, message: err.message })
    }
})

router.patch('/addMembers', verifyToken, async (req, res) => {
    try {
        const userId = req.authUser.id
        const { memberIds, groupId } = req.body
        const newMember = memberIds.map(userId => { return { userId } })
        console.log('newMember', newMember)
        const updatedData = await GroupChat.findOneAndUpdate(
            { _id: groupId },
            { $addToSet: { members: { $each: newMember } } },
            { new: true }
        )
        return res.status(201).json({ message: 'members added', updatedData })
    } catch (err) {
        console.log('err ', err.message)
        res.status(500).json({ ok: false, message: err.message })
    }
})


async function getGroup(req, res, next){
    let group
    try{
        group = await GroupChat.findById(req.params.id)
        .populate({path: 'members.userId', select: ['name', 'phone']})
        .populate({path: 'chats.userId', select: ['name', 'phone']})
        .populate({path: 'admin', select: ['name', 'phone']})
        if(group===null){
            return res.status(404).json({ok: false, message: 'group not found'})
        }
        res.group = group
        next()
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

router.get('/get/:id', [verifyToken, getGroup], async (req, res) => {
    res.json(res.group)
})

module.exports = router