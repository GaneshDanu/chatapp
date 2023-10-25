import React, { useEffect, useState } from "react";
import { getMyGroups } from "../../api/apis";

export default function Chat(){

    const [groups, setGroups] = useState([])

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

    return(
        <div className="chat-container">
            <h3>Groups List</h3>
            {
                groups.map((obj, idx)=>
                    <div key={idx}>
                        {obj.name}
                    </div>
                )
            }
        </div>
    )
}