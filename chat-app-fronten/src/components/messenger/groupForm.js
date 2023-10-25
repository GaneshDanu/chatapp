import React, { useState } from "react";
import { createGroup } from "../../api/apis";

export default function GroupForm({close}){
    const [groupInfo, setGroupInfo] = useState({});

    const handleChange = e => {
        const name = e.target.name
        const value = e.target.value
    
        setGroupInfo(prev=>{
            return {
                ...prev,
                [name]: value
            }
        })
      }
    
      const handleSubmit = async _ => {
        const { name} = groupInfo
        
        if(!name) return 
        const res = await createGroup({name})
        if(res.ok === false){
          return alert(res.message)
        }
        console.log('res ', res)
        close()
      }

    return(
        <div className="group-form-screen">
            <div className="group-form-body">
                <h1 className="login-title">Create Group</h1>
                <form className='login-form'>
                <div className='flex-col'>
                    <label htmlFor="name">Group Name:</label>
                    <input type="text" name="name" onChange={handleChange}/>
                </div>
                <button className='primary-btn' type='button' onClick={handleSubmit}>Create</button>
            </form>
            </div>
        </div>
    )
}