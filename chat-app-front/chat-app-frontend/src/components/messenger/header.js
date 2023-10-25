import React from 'react'

export default function Header({handleCreate}){


    return (
        <header className='header'>
            <h3 className='chat-app-logo'>WhatsApp</h3>
            <span onClick={_=>handleCreate(true)}>create Group</span>
        </header>
    )
}