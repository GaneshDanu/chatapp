import React, { useEffect, useState } from "react";
import Header from "./header";
import GroupForm from "./groupForm";
import { getMyGroups } from "../../api/apis";
import ChatList from "./chatList";
import Chat from "./chat";

export default function Home(){

    const [showCreateGroupForm, setShowCreateGroup] = useState(false)
    const [groups, setGroups] = useState([])
    const [opendChat, setOpendChat]=useState({show: false})

    const getAllGroups = async _ => {
        const res = await getMyGroups()
        if(res.ok === false){
            return alert(res.message)
        }
        console.log('res ', res)
        setGroups(res)
    }

    useEffect(_=>{
        getAllGroups()
    },[])

    const openChat = idx => {
        setOpendChat({show: true, ...groups[idx]})
    }

    return(
        <div>
            <Header handleCreate={setShowCreateGroup} />
            {showCreateGroupForm && <GroupForm getGroup={getAllGroups} close={_=>setShowCreateGroup(false)} />}
            {
                opendChat.show? <Chat close={_=>setOpendChat({show: false})} chatInfo={opendChat}/>:
                <ChatList close={_=>setOpendChat({show: false})} openChat={openChat} groups={groups}/>
            }
        </div>
    )
}