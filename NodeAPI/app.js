var fs = require("fs")
const express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var path = require('path')
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
const enrollModule = require('./enrollment.js')
var transaction = require('./transactions.js')
const queries = require('./query.js')
const fileupload = require('express-fileupload')
const defaultsPath = path.resolve(__dirname, 'defaults.json');
const defaultsJSON = fs.readFileSync(defaultsPath, 'utf8');
const defaults = JSON.parse(defaultsJSON);
let port = defaults["Port"] || 4001
const PostUrls = [];
const QueryUrls = [];
const csv=require("csvtojson");

/* 
 * Middleware
 */

let app = express();
app.options('*', cors());
app.use(fileupload({
    createParentPath:true
}))
// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.listen(port, function(err) {

       enrollModule.enrolladmin();
    if (err) {
         console.log("Cannot start the sever ")
     }else{
     console.log("server started at port ", port)
    }
})



app.use(function(req, res, next) {
    console.info(' ------>>>>>> new request for %s', req.originalUrl);
    if (req.originalUrl.indexOf('/login') >= 0) {
        return next();
    } else if (req.originalUrl.indexOf('/query') >= 0) {
        return next();
    } else if (req.originalUrl.indexOf('/trans') >= 0){
        return next();
    }

    var token = req.token;
    jwt.verify(token, app.get('secret'), function(err, decoded) {
        if (err) {
            res.send({
                success: false,
                message: 'Failed to authenticate token. Make sure to include the ' +
                    'token returned from /users call in the authorization header ' +
                    ' as a Bearer token'
            });
            return;
        } else {
            req.username = decoded.username;
            req.exp = decoded.exp;
            console.info('Decoded from JWT token: username - %s, expiry - %s', decoded.username, decoded.exp);
            return next();
        }
    });
});



async function sendResponse(res, result) {
    if (result.success) {
        res.status(200).send(result.message)
    } else {
        res.status(500).send(result.message)
    }
}


app.get("/query/:fcn", async function(req, res) {
    let fcn = req.params.fcn;
    let _args = req.body.args;
    let result = await queries.query(req.body.username, fcn, args)
    sendResponse(res, result)
})

app.post("/trans/:fcn", async function(req, res) {
    let fcn = req.params.fcn;
    let _args = req.body.args;
    let result = await transaction.submitInvoke(req.body.user,fcn,_args)
    sendResponse(res, result)
})


