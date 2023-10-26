import React, { useState } from 'react'

export default function addMember() {

	const [showMember, setShowMembers] = useState(false)
	const [allUsers, setAllUsers] = useState([])
	const [selectMode, setSelectMod] = useState(false)

	

	return (
		<div>
			<div onClick={_=>setSelectMod(prev=>!prev)}>{selectMode ? 'cancel' : 'add users'}</div>
			<div>
				{showMember &&
					allUsers.map(user =>
						<div key={user._id}>
							<h3>{user.name}</h3>
							<p>{user.phone}</p>
						</div>
					)
				}
			</div>
		</div>	
	)
}