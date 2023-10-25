const express = require('express')
const router = express.Router()
const GroupChat = require('../models/groupChatModel')
const verifyToken = require('../auth/verifyJWT')



router.get('/all', verifyToken, async(req, res)=>{
    try{
        const allGroups = await GroupChat.find()
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

// router.get('/:id', [verifyToken, getGroup], async(req, res)=>{
//     res.json(res.group)
// })

router.delete('/:id', verifyToken, async(req, res)=>{
    try{
        await GroupChat.findOneAndDelete({_id: req.params.id})
        res.json({message: 'Group Deleted'})
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})

router.patch('/member/:id', [verifyToken, getGroup], async(req, res)=>{
    try{
        const newMemberId = req.body.userId
        const members = res.group.members
        const isMemberExist= members.some(member=>member.userId.equals(newMemberId))
        if(isMemberExist){
            return res.status(409).json({message: 'member already exist', ok: false})
        }
        members.push({
            userId: newMemberId
        })
        const updatedGroup = await res.group.save()
        res.status(201).json(updatedGroup)
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})

router.delete('/:id/member/:userId', [verifyToken, getGroup], async(req, res)=>{
    try{
       const idx = res.group.members.findIndex(member=>member.userId.equals(req.params.userId))
        if(idx === -1){
            return res.status(404).json({ok: false, message: 'Member not found'})
        }

        res.group.members.splice(idx, 1)
        const updatedGroup = await res.group.save()
        res.status(201).json(updatedGroup)
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
    }
})


router.patch('/:id/chat', [verifyToken, getGroup], async(req, res)=>{
    try{
        res.group.chats.push({
            userId: req.body.userId,
            message: req.body.message
        }) 
        const updatedGroup = await res.group.save()
        res.status(201).json(updatedGroup)
    }catch(err){
        res.status(500).json({ok: false, message: err.message})
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
          .then(groupChats => {
            res.json(groupChats)
          });
    }catch(err){
        console.log('err ', err.message)
        res.status(500).json({ok: false, message: err.message})
    }
})


async function getGroup(req, res, next){
    let group
    try{
        group = await GroupChat.findById(req.params.id)
        if(group===null){
            return res.status(404).json({ok: false, message: 'group not found'})
        }
        res.group = group
        next()
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

module.exports = router