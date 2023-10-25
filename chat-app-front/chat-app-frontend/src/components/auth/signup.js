import React, { useState } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import { createUser } from '../../api/apis';
import { setLoginInfo } from '../../utils/genUtils';

export default function SignUp() {
  const [userInfo, setUserInfo] = useState({});
  const history = useNavigate()

  const handleChange = e => {
    const name = e.target.name
    const value = e.target.value

    setUserInfo(prev=>{
        return {
            ...prev,
            [name]: value
        }
    })
  }

  const handleSubmit = async _=> {
    const {name, password, phone} = userInfo
    // TODO add correct validation for name, password and phone
    if(!name || !password || !phone) return 
    const res = await createUser({...userInfo})
    console.log('res ', res)
    if(res.ok === false){
      return alert(res.message)
    }
    alert('Registration Successful')
    history('/login')
  }

  return (
    <div className='screen flex-col'>
        <div className='screen-wrapp flex-col'>
            <h2 className='login-title'>SignUp</h2>
            <form className='login-form'>
                <div className='flex-col'>
                  <label htmlFor="name">Name</label>
                  <input type="text" name="name" onChange={handleChange}/>
                </div>
                <div className='flex-col'>
                    <label htmlFor="phone">Phone:</label>
                    <input type="tel" name="phone" onChange={handleChange}/>
                </div>
                <div className='flex-col'>
                    <label htmlFor="password">Password:</label>
                    <input type="password" name="password" onChange={handleChange}/>
                </div>
                <button className='primary-btn' type="button" onClick={handleSubmit}>Signup</button>
            </form>
            <Link to="/login">Login</Link>
        </div>
    </div>
  );
}
