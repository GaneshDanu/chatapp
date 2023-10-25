import React, { useState } from "react";
import Header from "./header";
import Chat from "./chat";
import GroupForm from "./groupForm";

export default function Home(){

    const [showCreateGroupForm, setShowCreateGroup] = useState(false)

    return(
        <div>
            <Header handleCreate={setShowCreateGroup} />
            {showCreateGroupForm && <GroupForm close={_=>setShowCreateGroup(false)} />}
            <Chat/>
        </div>
    )
}