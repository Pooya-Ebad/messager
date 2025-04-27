const createHttpError = require("http-errors");
const Controller = require("../controller");
const { UserModel } = require("../../models/users");
const { SignAccessToken } = require("../../utils/functions");

class SupportController extends Controller {
    loginForm(req, res, next){
        try {
            return res.render("login.ejs", {
                error:undefined
            })
        } catch (error) {
            next(error)
        }
    }
    async login(req, res, next){
        try {
            const {mobile} = req.body;
            const user = await UserModel.findOne({mobile})
            if(!user){
                return res.render("login.ejs", {
                   error: "نام کاربری صحیح نمیباشد"
               })
            }
            const token = await SignAccessToken(user._id);
            res.cookie("authorization", token, {signed: true, httpOnly: true, expires: new Date(Date.now() + 1000*60*60*1)})
            user.token = token;
            user.save();
            return res.redirect("/");
        } catch (error) {
            next(error)
        }
    }
    registerForm(req, res, next){
        try {
            return res.render("register.ejs", {
                error: undefined
            })
        } catch (error) {
            next(error)
        }
    }
    async register(req, res, next){
        try {
            const {mobile, first_name, last_name, username} = req.body;
            const existUser = await UserModel.findOne({mobile});
            if(existUser){
                return res.render("register.ejs", {
                    error: "این شماره موبایل قبلا ثبت شده است"
                })
            }
            const user = await UserModel.create({
                first_name,
                last_name,
                username,
                mobile
            });
            const token = await SignAccessToken(user._id);
            res.cookie("authorization", token, {signed: true, httpOnly: true, expires: new Date(Date.now() + 1000*60*60*1)})
            user.token = token;
            await user.save();
            return res.redirect("/");
        } catch (error) {
            next(error)
        }
    }
    renderChatRoom(req, res, next){
        try {
            return res.render("chat.ejs")
        } catch (error) {
            next(error)
        }
    }
}
module.exports = {
    SupportController: new SupportController()
}