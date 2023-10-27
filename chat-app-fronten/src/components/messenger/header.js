import React from 'react'
import AddMember from '../member/addMember'
import { userId } from '../../utils/genUtils'

export default function Header({ handleCreate, groupInfo, closeParticipent }){

    return (
        <header className='header'>
            <div className='dFlex-SB'>
                <h3 className='chat-app-logo'>Chat App</h3>
                {
                    groupInfo._id ?
                        groupInfo.admin._id === userId()?
                            <AddMember close={closeParticipent} groupId={groupInfo._id} /> : null 
                            :
                        <span className='addBtn' onClick={_ => handleCreate(true)}>add Group</span>
                }
            </div>
        </header>
    )
}