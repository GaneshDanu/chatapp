import { getAuthToken, setLoginInfo } from "../utils/genUtils"

export const createUser = ({name, phone, password}) => {
    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({name, phone, password})
    }
    return fetch(`${process.env.REACT_APP_API_URL}/user`, requestOption)
    .then(res=>res.json())
    .catch(err=>{
        console.log('err ', err)
        if(err.response) return err.response
        return {ok: false, message: err.message}
    })
}

export const login = ({phone, password}) => {
    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({phone, password})
    }
    return fetch(`${process.env.REACT_APP_API_URL}/user/login`, requestOption)
    .then(res=>res.json()).then(res=>{
        setLoginInfo(res)
        return res
    })
    .catch(err=>{
        console.log('err ', err)
        if(err.response) return err.response
        return {ok: false, message: err.message}
    })
}

export const createGroup = ({name}) => {
    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({name})
    }
    return fetch(`${process.env.REACT_APP_API_URL}/group`, requestOption)
    .then(res=>res.json())
    .catch(err=>{
        console.log('err ', err)
        if(err.response) return err.response
        return {ok: false, message: err.message}
    })
}

export const getMyGroups = () => {
    const requestOption = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
    }
    return fetch(`${process.env.REACT_APP_API_URL}/group/mygroups`, requestOption)
    .then(res=>res.json())
    .catch(err=>{
        console.log('err ', err)
        if(err.response) return err.response
        return {ok: false, message: err.message}
    })
}

export const getAllUsers = () => {
    const requestOption = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
    }
    return fetch(`${process.env.REACT_APP_API_URL}/user/all`, requestOption)
    .then(res=>res.json())
    .catch(err=>{
        console.log('err ', err)
        if(err.response) return err.response
        return {ok: false, message: err.message}
    })
}

export const sendMessage = ({message, groupId}) => {
    const requestOption = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({message})
    }
    return fetch(`${process.env.REACT_APP_API_URL}/group/${groupId}/chat`, requestOption)
    .then(res=>res.json())
    .catch(err=>{
        console.log('err ', err)
        if(err.response) return err.response
        return {ok: false, message: err.message}
    })
}


export const getGroupNonParticipants = ({groupId}) => {
    const requestOption = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
    }
    return fetch(`${process.env.REACT_APP_API_URL}/group/${groupId}/nonparticipents`, requestOption)
        .then(res => res.json())
        .catch(err => {
            if (err.response) return err.response
            return { ok: false, message: err.message }
        })
}