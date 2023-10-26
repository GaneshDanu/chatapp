import React, { useEffect, useState } from 'react'
import { getAllUsers } from '../../api/apis'

export default function AddMember() {

	const [showMember, setShowMembers] = useState(false)
	const [allUsers, setAllUsers] = useState([])
	const [selectMode, setSelectMod] = useState(false)

	const getUserList = async _ => {
		const res = await  getAllUsers()
		if(res.ok === false){
			return alert(res.message)
		}

		console.log('res ', res)
	}

	useEffect(_=>{
		getUserList()
	},[])

	

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