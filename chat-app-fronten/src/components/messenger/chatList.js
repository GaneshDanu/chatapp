import React from "react";

export default function ChatList({groups, openChat}){

    return(
        <div className="chat-container">
            <h3 className="chat-list-title">Groups List</h3>
            {
                groups.map((obj, idx)=>
                    <div onClick={_=>openChat(idx)} className="group-chatWrap" key={idx}>
                        {obj.name}
                    </div>
                )
            }
        </div>
    )
}