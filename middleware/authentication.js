function authentication(req,res,next){
     if (!req.session || !req.session.user) {
    return res.redirect("/dashboard/auth/login"); // or whatever your login GET route is
  }
    next()
}

function authorization(req,res,next){
     if(req.session.user.type !== "admin"){
        return res.render("dashboard/auth/404", {error: "Only admins are allowed to access this page"})
    }
    next()
}

module.exports = {
    authentication,
    authorization
}