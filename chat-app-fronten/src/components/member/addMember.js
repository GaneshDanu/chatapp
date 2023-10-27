import React, { useEffect, useState } from 'react'
import { addMembersToGroup, getAllUsers, getGroupNonParticipants } from '../../api/apis'

export default function AddMember({groupId, close}) {

	const [showMember, setShowMembers] = useState(false)
	const [allUsers, setAllUsers] = useState([])
	const [selectMode, setSelectMod] = useState(false)

	const fetchGroupNonParticipants = async _ => {
		const res = await getGroupNonParticipants({ groupId })
		if(res.ok === false){
			return alert(res.message)
		}
		console.log('res ', res)
		setAllUsers(res)
	}

	useEffect(_=>{
		fetchGroupNonParticipants()
	}, [])
	
	const handleSelect = idx => {
		const users = [...allUsers]
		users[idx].selected = !users[idx].selected
		setAllUsers(users)
	}

	const addMembers = async _ => {
		const memberIds = []
		allUsers.forEach(user => {
			if (user.selected) {
				memberIds.push(user._id)
			}
		})

		if (memberIds.length === 0) {
			close()
			return
		}
		const res = await addMembersToGroup({ groupId, memberIds })
		if (res.ok === false) {
			return alert(res.message)
		}
		console.log('res ', res)
		close()
	}

	

	return (
		<div>
			<div onClick={_ => setShowMembers(prev=>!prev)}>{selectMode ? 'cancel' : 'add users'}</div>
			{showMember &&
			<div className='group-form-screen'>
				<div className="chat-container-wrapper add-parti-cont">
					<div className='close' onClick={close} />
					<h3>Add Participants</h3>
						<div className='addBtn add-parti-btn' onClick={addMembers}>add</div>
						<div className='part-list-cont'>
							{
								allUsers.map((user,idx) =>
									<div onClick={_=>handleSelect(idx)} className='group-chat-wrap' key={user._id}>
										<h3>{user.name}</h3>
										<p>{user.phone}</p>
										<div className={`select-icon ${user.selected && 'select-icon-active'}`} />
									</div>
								)
							}
						</div>
				</div>
			</div>
			}
		</div>	
	)
}