import React, { useRef, useState } from "react";
import { sendMessage } from "../../api/apis";
import { userId } from "../../utils/genUtils";

export default function Chat({chatInfo, close}){

    const [currMsg, setCurrMsg] = useState('')
    const [usrId] = useState(userId())
    const [chatData, setChatData] = useState(chatInfo)
    const inputRef = useRef()


    const handleChange = e => {
        setCurrMsg(e.target.value)
    }

    const handleSend=async _ =>{
        if(!currMsg.trim()) return
        const res = await sendMessage({message: currMsg.trim(), groupId: chatData._id})
        console.log('res ', res)
        setChatData(res)
        inputRef.current.value=''
        setCurrMsg('')
    }

    return(
        <div className="chat-container-wrapper">
            <div className="backIcon" onClick={close} />
            <h3 className="chat-group-title">{chatData.name}</h3>
            {
                chatData.chats.map(chat=>
                    <div className={`group-chat-wrap ${chat.userId._id === usrId && 'chat-right'}`} key={chat._id}>
                        <h5>{chat.userId.name}</h5>
                        <p>{chat.message}</p>
                    </div>
                )
            }

            <div className="chat-input-cont">
                <input placeholder="send message..." ref={inputRef} className="chat-input" type="text" onChange={handleChange} />
                <div className="chat-send" onClick={handleSend} />
            </div>
        </div>
    )
}