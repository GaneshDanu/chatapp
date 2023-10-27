import React from 'react'
import AddMember from '../member/addMember'

export default function Header({ handleCreate, groupId, closeParticipent }){


    return (
        <header className='header'>
            <div className='dFlex-SB'>
                <h3 className='chat-app-logo'>WhatsApp</h3>
                {
                    groupId ?
                        <AddMember close={closeParticipent} groupId={groupId} />:
                    <span className='addBtn' onClick={_ => handleCreate(true)}>add Group</span>
                }
            </div>
        </header>
    )
}