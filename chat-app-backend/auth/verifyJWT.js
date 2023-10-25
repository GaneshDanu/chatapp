const jwt = require('jsonwebtoken')

function verifyToken(req, res, next) {
  const authorization = req.headers['authorization'];
  if(!authorization){
    return res.status(401).json({ message: 'invalid token' });
  }
  let token
  try{
    token = authorization.split(' ')[1]
  }catch(err){}

  if (!token) {
    return res.status(403).json({ message: 'Token not provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ ok: false, message: err.message });
    }

    req.authUser = decoded;
    console.log('decode ', decoded)
    next();
  });
}

module.exports = verifyToken;
