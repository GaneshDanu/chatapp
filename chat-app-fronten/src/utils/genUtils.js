export const isLoggedIn = _ =>{
    let user = localStorage.getItem('user')
    if(!user) return false

    user = JSON.parse(user)

    if(!user.token) return

    return true
}

export const getAuthToken= _ => {
    let user = localStorage.getItem('user')
    if(!user) return false

    user = JSON.parse(user)

    return user.token
}

export const userId= _ => {
    let user = localStorage.getItem('user')
    if(!user) return false

    user = JSON.parse(user)
    return user.userInfo._id
}

export const setLoginInfo = info => {
    localStorage.setItem('user', JSON.stringify(info))
}