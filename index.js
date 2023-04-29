import express from 'express'
import path from 'path'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const app = express()

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName: "backend",
})
.then(() => console.log("Datebase connected"))
.catch((e) => console.error(e))

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const User = mongoose.model("User",userSchema)

// const users = []

// using Middleware
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.set('view engine', 'ejs')

const isAuthenticated = async (req,res,next) => {
    const {token} = req.cookies

    if(token){
        const decoded = jwt.verify(token,"jjdjfsjsdsojfoi")
        req.user = await User.findById(decoded._id)
        next()
    }
    else{
        res.redirect("/register")
    }
}

app.get('/',isAuthenticated,(req, res)=>{
    // console.log(req.cookies)
    console.log(req.user)
    res.render('logout',{name:req.user.name})
})

app.get('/register',(req, res)=>{
    res.render('register')
})

app.get('/login',async(req, res)=>{
    res.render("login")
})

app.get("/logout",(req,res) => {
    res.cookie("token",null,{
        httpOnly:true,
        expires: new Date(Date.now())
    })
    res.redirect("/login")
})

app.post("/login",async (req, res) => {
    const {email,password} = req.body
    const currUser = await User.findOne({email})

    if(!currUser){
        return res.redirect('/register')
    }
    
    const isMatch = await bcrypt.compare(password,currUser.password)

    if(!isMatch){
        return res.render("login",{email,message:"Incorrect Password"})
    }

    const token = jwt.sign({_id:currUser._id},"jjdjfsjsdsojfoi")

    res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})

app.post("/register",async(req,res) => {
    console.log(req.body)
    const {name,email,password} = req.body

    const currUser = await User.findOne({email})
    if(currUser){
        return res.redirect("/login")
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const user = await User.create({
        name,
        email,
        password:hashedPassword,
    })

    const token = jwt.sign({_id:user._id},"jjdjfsjsdsojfoi")

    res.cookie("token",token,{
        httpOnly:true,
        expires: new Date(Date.now()+60*1000)
    })
    res.redirect("/")
})



// app.get('/',(req, res)=>{
//     res.render("index",{name: "Arnab"})
// })

// app.post('/',(req, res)=>{
//     console.log(req.body)
//     users.push({username: req.body.name,email: req.body.email})
//     console.log(users)
//     res.redirect("success")
// })

// app.get('/add',(req, res)=>{
//     res.send("Nice")
// })

// app.get('/success',(req, res)=>{
//     res.render("success")
// })

// app.get('/users',(req, res)=>{
//     res.json({
//         users
//     })
// })


app.listen(5000,()=>{
    console.log('server is running')
})