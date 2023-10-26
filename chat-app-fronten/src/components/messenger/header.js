import React from 'react'

export default function Header({handleCreate}){


    return (
        <header className='header'>
            <div className='dFlex-SB'>
                <h3 className='chat-app-logo'>WhatsApp</h3>
                <span className='addBtn' onClick={_=>handleCreate(true)}>add Group</span>
            </div>
        </header>
    )
}