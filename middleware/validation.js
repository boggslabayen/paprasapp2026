function validation(req,res,next){
const errors = {}

    if(req.body.firstName === ""){
        errors.firstName= "please enter a valid firstName"
    }

     if(req.body.lastName === ""){
        errors.lastName= "please enter a valid lastName"
    }

     if(req.body.email === ""){
        errors.email= "please enter a valid email"
    }

     if(req.body.password !== req.body.confirmPassword) {
        errors.password= "password did not match"
    }

    if(Object.keys(errors).length > 0){
        return res.render("auth/register",{errors})
    }
     next()
}

module.exports = {
    validation
}

