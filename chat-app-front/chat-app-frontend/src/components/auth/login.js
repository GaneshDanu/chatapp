import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/apis';


export default function Login() {
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

  const handleSubmit = async _ => {
    const { password, phone} = userInfo
    // TODO add correct validation for name, password and phone
    if(!password || !phone) return 
    const res = await login({...userInfo})
    if(res.ok === false){
      return alert(res.message)
    }
    history('/')
  }

  return (
    <div className='screen flex-col'>
        <div className='screen-wrapp flex-col'>
            <h2 className='login-title'>Login</h2>
            <form className='login-form'>
                <div className='flex-col'>
                    <label htmlFor="phone">Phone:</label>
                    <input type="tel" name="phone" onChange={handleChange}/>
                </div>
                <div className='flex-col'>
                    <label htmlFor="password">Password:</label>
                    <input type="password" name="password" onChange={handleChange}/>
                </div>
                <button className='primary-btn' type='button' onClick={handleSubmit}>Login</button>
            </form>

            <Link to="/signup">Signup</Link>
        </div>
    </div>
  );
}
